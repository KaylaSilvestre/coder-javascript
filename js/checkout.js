document.addEventListener("DOMContentLoaded", initCheckoutPage);

function initCheckoutPage() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  //Ruta base para local y github
  const URL_BASE = window.location.hostname.includes("github.io")
    ? "/coder-javascript/"
    : "/";

  //Constantes
  const LS_KEY = "carrito";
  const LS_KEY_CUPON = "cuponActivo";
  const ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwqxIZE9aJOhvYdAr_g7siTbBIwls6aJoA7SQICOhAcLgTNnryyj7K2M-qxULYzEYGC0g/exec";

  const ENVIO_GRATIS_DESDE = 1500;
  const COSTO_ENVIO = 150;

  //Helpers
  const getCarrito = () => JSON.parse(localStorage.getItem(LS_KEY)) || [];

  const getCuponActivo = () =>
    JSON.parse(localStorage.getItem(LS_KEY_CUPON)) || false;

  const calcularTotales = (carrito, cuponActivo) => {
    const subtotal = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    const descuento = cuponActivo && subtotal > 0 ? subtotal * 0.15 : 0;

    let envio = 0;
    if (subtotal === 0) envio = 0;
    else if (subtotal - descuento >= ENVIO_GRATIS_DESDE) envio = 0;
    else envio = COSTO_ENVIO;

    const total = subtotal - descuento + envio;

    return { subtotal, descuento, envio, total };
  };

  const generarIdOrden = () => {
    const f = new Date();
    const y = f.getFullYear();
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const d = String(f.getDate()).padStart(2, "0");
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `HPM-${y}${m}${d}-${rand}`;
  };

  //DOM refs
  const itemsBox = document.getElementById("items");
  const rSub = document.getElementById("r-subtotal");
  const rDesc = document.getElementById("r-descuento");
  const rEnv = document.getElementById("r-envio");
  const rTot = document.getElementById("r-total");
  const rCupon = document.getElementById("r-cupon");

  const errorBox = document.getElementById("error");
  const btnConfirmar = document.getElementById("btn-confirmar");

  const pagoInfo = document.getElementById("pago-info");
  const extraInfo = document.getElementById("extra-info");
  const resumenPago = document.getElementById("resumen-pago");

  //Carga resumen
  const carrito = getCarrito();
  const cuponActivo = getCuponActivo();

  if (!carrito.length) {
    itemsBox.innerHTML = "<p class='muted'>Tu carrito está vacío 🙂</p>";
    btnConfirmar.disabled = true;
    return;
  }

  itemsBox.innerHTML = `
    <ul>
      ${carrito
        .map(
          (p) =>
            `<li>${p.nombre} x ${p.cantidad} — $${p.precio * p.cantidad}</li>`,
        )
        .join("")}
    </ul>
  `;

  const { subtotal, descuento, envio, total } = calcularTotales(
    carrito,
    cuponActivo,
  );

  rSub.textContent = `$${subtotal.toFixed(2)}`;
  rDesc.textContent = descuento > 0 ? `-$${descuento.toFixed(2)}` : "$0";
  rEnv.textContent = envio === 0 ? "GRATIS" : `$${envio.toFixed(2)}`;
  rTot.textContent = `$${total.toFixed(2)}`;
  rCupon.textContent = cuponActivo ? "Cupón PRIMERA15 aplicado (15% OFF)" : "";

  //UX metodo de pago
  const extraPago = document.getElementById("extra-pago");
  const extraIcon = document.getElementById("extra-icon");

  document.querySelectorAll("input[name='pago']").forEach((radio) => {
    radio.addEventListener("change", () => {
      if (pagoInfo) pagoInfo.style.display = "inline-block";
      if (extraInfo) extraInfo.style.display = "block";

      if (!extraPago || !extraIcon) return;

      if (radio.value === "mercadopago") {
        extraPago.textContent = "Mercado Pago";
        extraIcon.className = "pago-icon fa-regular fa-credit-card";
        extraInfo.className = "box mercadopago";
      } else {
        extraPago.textContent = "Transferencia bancaria";
        extraIcon.className = "pago-icon fa-solid fa-building-columns";
        extraInfo.className = "box transferencia";
      }
    });
  });

  //Volver
  const btnVolver = document.getElementById("volver");
  if (btnVolver) {
    btnVolver.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.history.length > 1) window.history.back();
      else window.location.href = URL_BASE + "productos.html";
    });
  }

  //Confirmar pedido
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pagoSeleccionado = form.elements["pago"]?.value;

    if (pagoSeleccionado === "transferencia") {
      Swal.fire({
        icon: "warning",
        title: "Transferencia bancaria",
        html: `
      <p>Actualmente estamos optimizando este método de pago desde la web.</p>
      <p><strong>Para continuar con tu compra podés:</strong></p>
      <ul style="text-align:left; margin-top:10px">
        <li>Contactarnos por <b>WhatsApp</b> y realizar la transferencia por allí</li>
        <li>Elegir <b>Mercado Pago</b> para finalizar la compra al instante</li>
      </ul>
    `,
        showCancelButton: true,
        confirmButtonText: "Contactar por WhatsApp",
        cancelButtonText: "Usar Mercado Pago",
        confirmButtonColor: "#2E4C3F",
        cancelButtonColor: "#64748b",
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(
            "https://wa.me/59898124186?text=Hola,%20quiero%20finalizar%20mi%20compra%20por%20transferencia%20bancaria",
            "_blank",
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          const orden = {
            id: generarIdOrden(),
            fechaISO: new Date().toISOString(),
            cliente: {
              nombre: document.getElementById("nombre").value.trim(),
              email: document.getElementById("email").value.trim(),
              telefono: document.getElementById("telefono").value.trim(),
            },
            pago: "mercadopago",
            cuponActivo,
            totales: { subtotal, descuento, envio, total },
            items: carrito,
            estado: "recibida",
          };

          localStorage.setItem("ultimaOrden", JSON.stringify(orden));
          localStorage.setItem("carrito", JSON.stringify([]));
          localStorage.setItem("cuponActivo", JSON.stringify(false));

          window.location.href = `${URL_BASE}pages/mercado-pago.html`;
        }
      });

      return;
    }
    errorBox.style.display = "none";
    errorBox.textContent = "";

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const pago = form.elements["pago"]?.value;

    if (!nombre || !email || !telefono || !pago) {
      errorBox.style.display = "block";
      errorBox.textContent = "Por favor completá todos los datos.";
      return;
    }

    const orden = {
      id: generarIdOrden(),
      fechaISO: new Date().toISOString(),
      cliente: { nombre, email, telefono },
      pago,
      cuponActivo,
      totales: { subtotal, descuento, envio, total },
      items: carrito,
      estado: "recibida",
    };

    try {
      await fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(orden),
      });
    } catch (err) {}

    localStorage.setItem("ultimaOrden", JSON.stringify(orden));
    localStorage.setItem("carrito", JSON.stringify([]));
    localStorage.setItem("cuponActivo", JSON.stringify(false));

    window.location.href = `${URL_BASE}pages/mercado-pago.html`;
  });
}
