const orden = JSON.parse(localStorage.getItem("ultimaOrden"));
const sinOrden = document.getElementById("sin-orden");
const info = document.getElementById("info");
const detalle = document.getElementById("detalle");
const pagoMP = document.getElementById("pago-mp");

if (!orden) {
  sinOrden.classList.remove("hidden");

  info.classList.add("hidden");
  detalle.classList.add("hidden");
  pagoMP.classList.add("hidden");
} else {
  sinOrden.classList.add("hidden");

  info.classList.remove("hidden");
  detalle.classList.remove("hidden");
  pagoMP.classList.remove("hidden");

  // Info orden
  document.getElementById("orden-nombre").textContent = orden.cliente.nombre;
  document.getElementById("orden-id").textContent = orden.id;
  document.getElementById("orden-total").textContent =
    orden.totales.total.toFixed(2);
  document.getElementById("orden-email").textContent = orden.cliente.email;
  document.getElementById("orden-telefono").textContent =
    orden.cliente.telefono;

  // Lista productos
  const lista = document.getElementById("lista-productos");
  lista.innerHTML = "";

  orden.items.forEach((p) => {
    const li = document.createElement("li");
    li.className = "producto-item";
    li.textContent = `${p.nombre} x ${p.cantidad} — $${p.precio}`;
    lista.appendChild(li);
  });

  // Totales
  document.getElementById("subtotal").textContent =
    orden.totales.subtotal.toFixed(2);
  document.getElementById("descuento").textContent =
    orden.totales.descuento > 0
      ? `-$${orden.totales.descuento.toFixed(2)}`
      : "$0";

  document.getElementById("envio").textContent =
    orden.totales.envio === 0 ? "GRATIS" : `$${orden.totales.envio.toFixed(2)}`;

  setupMercadoPago(orden);
}

function setupMercadoPago(orden) {
  const LINK_MP = "https://link.mercadopago.com.uy/hechopamiuy";
  const WHATSAPP_NUM = "59898124186";

  const total = String(Math.round(Number(orden.totales.total)));
  const listaProductos = orden.items
    .map((p) => `${p.nombre} x${p.cantidad}`)
    .join(", ");

  document.getElementById("mp-total").textContent = total;
  document.getElementById("mp-orden").textContent = orden.id;
  document.getElementById("link-mp").href = LINK_MP;

  const textoPago = `
Hola! Mi pedido ${orden.id} quedó abonado por Mercado Pago.
Total: $${total}
Productos: ${listaProductos}
Correo: ${orden.cliente.email}
Teléfono: ${orden.cliente.telefono}
Adjunto comprobante.
`;

  document.getElementById("avisar-wsp").href =
    `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(textoPago)}`;

  const msg = document.getElementById("copiado-msg");
  const estadoPago = document.getElementById("estado-pago");

  document
    .getElementById("copiar-total")
    .addEventListener("click", async () => {
      await navigator.clipboard.writeText(total);
      msg.textContent = "✅ Total copiado";
      msg.classList.add("visible");
      setTimeout(() => msg.classList.remove("visible"), 1500);
    });

  document.getElementById("avisar-wsp").addEventListener("click", () => {
    orden.estado = "abonado";
    orden.abonadoEnISO = new Date().toISOString();
    localStorage.setItem("ultimaOrden", JSON.stringify(orden));

    estadoPago.textContent = "✅ Abrimos WhatsApp para avisar el pago.";
  });
}
