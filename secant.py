import math


def f(x):
    """Default equation retained from the original calculator."""
    return 2 * x**3 - x - math.exp(-x)


def secant(x0, x1, tolerance, max_steps, function=f):
    """Approximate a root with the Secant method and return every iteration."""
    iterations = []

    for step in range(1, max_steps + 1):
        fx0 = function(x0)
        fx1 = function(x1)
        difference_y = fx1 - fx0
        if difference_y == 0:
            return {
                "root": None,
                "status": "Gagal: pembagian dengan nol",
                "iterations": iterations,
                "tolerance": tolerance,
            }

        difference_x = x1 - x0
        x2 = x1 - difference_x * fx1 / difference_y
        fx2 = function(x2)
        error = abs(fx2)
        if not all(math.isfinite(value) for value in (fx0, fx1, x2, fx2, error)):
            raise ValueError("Perhitungan menghasilkan angka yang tidak terbatas. Coba tebakan awal lain.")

        iterations.append({
            "step": step,
            "x0": x0,
            "xi": x1,
            "y0": fx0,
            "yi": fx1,
            "dx": difference_x,
            "dy": difference_y,
            "x_next": x2,
            "fx_next": fx2,
            "error": error,
        })

        if error <= tolerance:
            return {
                "root": x2,
                "status": "Konvergen",
                "iterations": iterations,
                "tolerance": tolerance,
            }

        x0, x1 = x1, x2

    return {
        "root": x1,
        "status": "Tidak konvergen: maksimum iterasi tercapai",
        "iterations": iterations,
        "tolerance": tolerance,
    }
