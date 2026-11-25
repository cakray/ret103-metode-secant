import ast
import math
import operator

from flask import Flask, jsonify, render_template, request

from secant import secant

app = Flask(__name__)

FUNCTIONS = {
    "abs": abs,
    "cos": math.cos,
    "exp": math.exp,
    "log": math.log,
    "sin": math.sin,
    "sqrt": math.sqrt,
    "tan": math.tan,
}
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: math.pow,
}


def compile_expression(source):
    """Compile a small, explicit set of mathematical expression nodes."""
    if not isinstance(source, str) or not source.strip():
        raise ValueError("Persamaan f(x) wajib diisi.")
    if len(source) > 160:
        raise ValueError("Persamaan terlalu panjang (maksimal 160 karakter).")

    try:
        tree = ast.parse(source.replace("^", "**"), mode="eval")
    except (SyntaxError, ValueError):
        raise ValueError("Format persamaan tidak valid. Periksa operator dan tanda kurung.") from None

    nodes = list(ast.walk(tree))
    if len(nodes) > 64:
        raise ValueError("Persamaan terlalu rumit (maksimal 64 elemen).")

    allowed_nodes = (ast.Expression, ast.Constant, ast.Name, ast.Load, ast.UnaryOp,
                     ast.UAdd, ast.USub, ast.BinOp, ast.Add, ast.Sub, ast.Mult,
                     ast.Div, ast.Pow, ast.Call)
    if any(not isinstance(node, allowed_nodes) for node in nodes):
        raise ValueError("Persamaan hanya boleh memakai x, angka, pi, e, +, -, *, /, ^, dan fungsi yang didukung.")
    for node in nodes:
        if isinstance(node, ast.Name) and node.id not in {"x", "pi", "e", *FUNCTIONS}:
            raise ValueError(f"Nama '{node.id}' tidak diizinkan.")
        if isinstance(node, ast.Call) and (not isinstance(node.func, ast.Name) or node.func.id not in FUNCTIONS or node.keywords or len(node.args) != 1):
            raise ValueError("Fungsi harus berupa sin, cos, tan, exp, log, sqrt, atau abs dengan satu argumen.")

    def evaluate(node, x):
        if isinstance(node, ast.Expression):
            return evaluate(node.body, x)
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value
        if isinstance(node, ast.Name):
            if node.id == "x":
                return x
            if node.id == "pi":
                return math.pi
            if node.id == "e":
                return math.e
            raise ValueError(f"Nama '{node.id}' tidak diizinkan.")
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = evaluate(node.operand, x)
            return value if isinstance(node.op, ast.UAdd) else -value
        if isinstance(node, ast.BinOp) and type(node.op) in OPERATORS:
            left = evaluate(node.left, x)
            right = evaluate(node.right, x)
            if isinstance(node.op, ast.Pow) and abs(right) > 100:
                raise ValueError("Pangkat dibatasi antara -100 dan 100.")
            return OPERATORS[type(node.op)](left, right)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            function = FUNCTIONS.get(node.func.id)
            if function is None or node.keywords or len(node.args) != 1:
                raise ValueError("Fungsi harus berupa sin, cos, tan, exp, log, sqrt, atau abs dengan satu argumen.")
            return function(evaluate(node.args[0], x))
        raise ValueError("Persamaan hanya boleh memakai x, angka, pi, e, +, -, *, /, ^, dan fungsi yang didukung.")

    def function(x):
        try:
            value = float(evaluate(tree, x))
        except ValueError as exc:
            raise ValueError(f"Persamaan tidak terdefinisi pada x = {x:g}. Periksa domain fungsi yang dipakai.") from exc
        except ArithmeticError as exc:
            raise ValueError("Persamaan menghasilkan perhitungan di luar domain atau rentang angka.") from exc
        if not math.isfinite(value):
            raise ValueError("Persamaan menghasilkan angka yang tidak terbatas.")
        return value

    return function


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/calculate")
def calculate():
    data = request.get_json(silent=True) or {}
    try:
        if not isinstance(data, dict):
            raise ValueError("Kirim parameter perhitungan dalam format JSON object.")
        expression = data.get("equation", "")
        function = compile_expression(expression)

        def parse_number(key, label):
            try:
                return float(data[key])
            except (KeyError, TypeError, ValueError):
                raise ValueError(f"{label} harus diisi dengan angka yang valid.") from None

        x0 = parse_number("x0", "Tebakan awal x₀")
        x1 = parse_number("x1", "Tebakan awal x₁")
        tolerance = parse_number("tolerance", "Toleransi")
        try:
            max_steps = int(data["max_steps"])
        except (KeyError, TypeError, ValueError):
            raise ValueError("Iterasi maksimum harus berupa bilangan bulat.") from None

        if not all(math.isfinite(value) for value in (x0, x1, tolerance)):
            raise ValueError("Semua angka harus berupa nilai terbatas.")
        if tolerance <= 0:
            raise ValueError("Toleransi harus lebih besar dari 0.")
        if max_steps < 1 or max_steps > 500:
            raise ValueError("Iterasi maksimum harus berada antara 1 dan 500.")

        result = secant(x0, x1, tolerance, max_steps, function)
        result["equation"] = expression
        if result["status"] == "Gagal: pembagian dengan nol":
            return jsonify({"error": "f(x₀) dan f(x₁) menghasilkan nilai yang sama. Coba tebakan awal lain."}), 422
        return jsonify(result)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc) or "Periksa kembali semua input."}), 400
    except (ArithmeticError, OverflowError) as exc:
        return jsonify({"error": "Perhitungan gagal karena pembagian dengan nol atau nilai di luar rentang."}), 422


if __name__ == "__main__":
    app.run(debug=True)
