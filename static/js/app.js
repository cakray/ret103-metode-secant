(() => {
  const form = document.querySelector("#calculation-form");
  const feedback = document.querySelector("#feedback");
  const calculateButton = document.querySelector("#calculate-button");
  const calculateLabel = document.querySelector("#calculate-label");
  const themeSelect = document.querySelector("#theme-select");
  const exportButton = document.querySelector("#export-button");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let currentResult = null;
  let xChart = null;
  let errorChart = null;

  const value = (id) => document.querySelector(`#${id}`).value;
  const number = (input) => Number(input).toLocaleString("id-ID", { maximumSignificantDigits: 12 });

  function applyTheme(mode) {
    const theme = mode === "system" ? (media.matches ? "dark" : "light") : mode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (xChart && errorChart) updateChartColors();
  }

  themeSelect.value = localStorage.getItem("secant-theme") || "system";
  applyTheme(themeSelect.value);
  themeSelect.addEventListener("change", () => {
    localStorage.setItem("secant-theme", themeSelect.value);
    applyTheme(themeSelect.value);
  });
  media.addEventListener("change", () => {
    if (themeSelect.value === "system") applyTheme("system");
  });

  function setFeedback(message, kind = "info") {
    feedback.textContent = message;
    feedback.className = "mt-5 rounded-2xl px-4 py-3 text-sm";
    if (kind === "error") {
      feedback.classList.add("bg-red-50", "text-red-800", "dark:bg-red-950", "dark:text-red-100");
    } else if (kind === "success") {
      feedback.classList.add("bg-primary-container", "text-on-primary-container");
    } else {
      feedback.classList.add("bg-surface", "text-muted");
    }
  }

  function showError(message) {
    clearResult();
    document.querySelector("#result-status").textContent = "Perlu diperiksa";
    setFeedback(message, "error");
  }

  function clearResult() {
    currentResult = null;
    exportButton.disabled = true;
    document.querySelector("#result-content").classList.add("hidden");
    document.querySelector("#result-empty").classList.remove("hidden");
    document.querySelector("#table-wrap").classList.add("hidden");
    document.querySelector("#table-empty").classList.remove("hidden");
    document.querySelector("#iteration-rows").replaceChildren();
    document.querySelector("#result-status").textContent = "Belum dihitung";
    if (xChart) xChart.destroy();
    if (errorChart) errorChart.destroy();
    xChart = null;
    errorChart = null;
    document.querySelector("#x-chart-wrap").classList.add("hidden");
    document.querySelector("#error-chart-wrap").classList.add("hidden");
    document.querySelector("#x-chart-empty").classList.remove("hidden");
    document.querySelector("#error-chart-empty").classList.remove("hidden");
  }

  function renderTable(rows, tolerance) {
    const body = document.querySelector("#iteration-rows");
    body.replaceChildren();
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      if (row.error <= tolerance) tr.className = "bg-primary-container/60 text-on-primary-container";
      const cells = [row.step, row.x0, row.xi, row.y0, row.yi, row.dx, row.dy, row.x_next, row.error];
      cells.forEach((cell, index) => {
        const td = document.createElement("td");
        td.className = index === 0 ? "px-3 py-3 text-center font-medium" : "px-3 py-3";
        td.textContent = index === 0 ? String(cell) : number(cell);
        tr.append(td);
      });
      body.append(tr);
    });
    document.querySelector("#table-empty").classList.add("hidden");
    document.querySelector("#table-wrap").classList.remove("hidden");
  }

  function chartPalette() {
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue("--md-primary").trim().split(/\s+/).map(Number);
    const ink = style.getPropertyValue("--md-on-surface-variant").trim().split(/\s+/).map(Number);
    const outline = style.getPropertyValue("--md-outline-variant").trim().split(/\s+/).map(Number);
    return {
      primary: `rgb(${primary.join(",")})`,
      ink: `rgb(${ink.join(",")})`,
      grid: `rgba(${outline.join(",")},.55)`,
    };
  }

  function createCharts(rows) {
    if (typeof Chart === "undefined") return false;
    document.querySelector("#x-chart-empty").classList.add("hidden");
    document.querySelector("#error-chart-empty").classList.add("hidden");
    document.querySelector("#x-chart-wrap").classList.remove("hidden");
    document.querySelector("#error-chart-wrap").classList.remove("hidden");
    const palette = chartPalette();
    const labels = rows.map((row) => row.step);
    const baseOptions = (title, yTitle) => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => `${yTitle}: ${number(item.parsed.y)}` } },
      },
      scales: {
        x: { title: { display: true, text: "Iterasi", color: palette.ink }, ticks: { color: palette.ink, maxRotation: 0, autoSkip: true }, grid: { color: palette.grid } },
        y: { title: { display: true, text: yTitle, color: palette.ink }, ticks: { color: palette.ink }, grid: { color: palette.grid } },
      },
    });
    const dataset = (label, data) => ({
      label, data, borderColor: palette.primary, backgroundColor: palette.primary,
      pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, tension: 0,
    });
    xChart = new Chart(document.querySelector("#x-chart"), {
      type: "line",
      data: { labels, datasets: [dataset("Xi+1", rows.map((row) => row.x_next))] },
      options: baseOptions("Nilai pendekatan", "Xi+1"),
    });
    errorChart = new Chart(document.querySelector("#error-chart"), {
      type: "line",
      data: { labels, datasets: [dataset("Error |f(Xi+1)|", rows.map((row) => row.error))] },
      options: baseOptions("Error", "Error |f(Xi+1)|"),
    });
    return true;
  }

  function updateChartColors() {
    const palette = chartPalette();
    [xChart, errorChart].forEach((chart) => {
      if (!chart) return;
      chart.data.datasets.forEach((dataset) => {
        dataset.borderColor = palette.primary;
        dataset.backgroundColor = palette.primary;
      });
      ["x", "y"].forEach((axis) => {
        chart.options.scales[axis].title.color = palette.ink;
        chart.options.scales[axis].ticks.color = palette.ink;
        chart.options.scales[axis].grid.color = palette.grid;
      });
      chart.update("none");
    });
  }

  function renderResult(result) {
    currentResult = result;
    const converged = result.status === "Konvergen";
    document.querySelector("#result-status").textContent = result.status;
    document.querySelector("#root-value").textContent = number(result.root);
    document.querySelector("#iteration-count").textContent = String(result.iterations.length);
    document.querySelector("#last-error").textContent = number(result.iterations[result.iterations.length - 1].error);
    document.querySelector("#result-tolerance").textContent = number(result.tolerance);
    document.querySelector("#result-empty").classList.add("hidden");
    document.querySelector("#result-content").classList.remove("hidden");
    exportButton.disabled = false;
    renderTable(result.iterations, result.tolerance);
    const chartsReady = createCharts(result.iterations);
    const statusMessage = converged ? "Perhitungan selesai dan memenuhi toleransi." : "Perhitungan selesai, tetapi toleransi belum tercapai dalam batas iterasi.";
    setFeedback(chartsReady ? statusMessage : `${statusMessage} Grafik tidak dimuat; periksa koneksi untuk memuat Chart.js.`, chartsReady && converged ? "success" : chartsReady ? "info" : "error");
  }

  form.addEventListener("input", () => {
    if (!currentResult) return;
    clearResult();
    setFeedback("Parameter berubah. Hitung ulang untuk memperbarui hasil.");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    clearResult();
    calculateButton.disabled = true;
    calculateLabel.textContent = "Menghitung…";
    setFeedback("Perhitungan sedang diproses oleh server.");
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ equation: value("equation"), x0: value("x0"), x1: value("x1"), tolerance: value("tolerance"), max_steps: value("max_steps") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Perhitungan gagal. Periksa input.");
      renderResult(result);
    } catch (error) {
      showError(error.message || "Server tidak dapat dihubungi. Coba lagi.");
    } finally {
      calculateButton.disabled = false;
      calculateLabel.textContent = "Hitung";
    }
  });

  document.querySelector("#example-button").addEventListener("click", () => {
    clearResult();
    document.querySelector("#equation").value = "2*x^3 - x - exp(-x)";
    document.querySelector("#x0").value = "0";
    document.querySelector("#x1").value = "1";
    document.querySelector("#tolerance").value = "0.0001";
    document.querySelector("#max_steps").value = "50";
    setFeedback("Contoh persamaan dan parameter awal telah diisi.");
    document.querySelector("#equation").focus();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearResult();
      setFeedback("Parameter dikembalikan ke nilai awal.");
    }, 0);
  });

  exportButton.addEventListener("click", () => {
    if (!currentResult) return;
    const columns = ["Iterasi", "X0", "Xi", "Y0", "Yi", "Xi-X0", "Yi-Y0", "Xi+1", "Error"];
    const rows = currentResult.iterations.map((row) => [row.step, row.x0, row.xi, row.y0, row.yi, row.dx, row.dy, row.x_next, row.error]);
    const csv = [columns, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "hasil-metode-secant.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
