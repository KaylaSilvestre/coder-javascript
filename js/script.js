document.addEventListener("DOMContentLoaded", () => {
  //Carga de productos desdde JSON
  let productos = [];

  //Ruta base para local y github
  const URL_BASE = window.location.hostname.includes("github.io")
    ? "/coder-javascript/"
    : "/";

  //url_base para el fetch
  fetch(URL_BASE + "productos.json")
    .then((res) => res.json())
    .then((data) => {
      //Normalizacion de rutas de imagenes
      productos = data.map((p) => {
        return {
          ...p,
          img: p.img.replace(/^(\.\.\/)+/, ""), // quita todos los "../" del inicio
        };
      });

      mostrarCarrito();
      if (typeof actualizarIconosFavoritos === "function")
        actualizarIconosFavoritos();
    });

  //Claves LocalStorage
  const LS_KEYS = {
    carrito: "carrito",
    cupon: "cuponActivo",
    favoritos: "favoritos",
  };

  const ENVIO_GRATIS_DESDE = 1500;
  const COSTO_ENVIO = 150;
  const DESCUENTO_CUPON = 0.15;

  //Helpers LocalStorage
  function getLS(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  //Guarda datos en el LocalStorage
  function setLS(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  //Calculo totales del carrito
  //Esto devuelve subtotal, descuento, envio y total
  function calcularTotales(carrito, cuponActivo) {
    const subtotal = carrito.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0,
    );

    const descuento =
      cuponActivo && subtotal > 0 ? subtotal * DESCUENTO_CUPON : 0;

    const envio =
      subtotal === 0
        ? 0
        : subtotal - descuento >= ENVIO_GRATIS_DESDE
          ? 0
          : COSTO_ENVIO;

    const total = subtotal - descuento + envio;

    return { subtotal, descuento, envio, total };
  }

  //Estado global
  //Se cargan los datos guardados del  usuario
  let carrito = getLS(LS_KEYS.carrito, []);
  let cuponActivo = getLS(LS_KEYS.cupon, false);
  let favoritos = getLS(LS_KEYS.favoritos, []);

  //Sidebar del carrito
  const btnCarrito = document.getElementById("btn-carrito");
  const sidebar = document.getElementById("carrito-sidebar");
  const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");

  function abrirCarrito() {
    sidebar.classList.add("activo");
  }

  function cerrarCarrito() {
    sidebar.classList.remove("activo");
  }

  btnCarrito?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirCarrito();
  });

  btnCerrarCarrito?.addEventListener("click", cerrarCarrito);

  //Guardar estado del carrito
  function guardarEstadoCarrito() {
    setLS(LS_KEYS.carrito, carrito);
    setLS(LS_KEYS.cupon, cuponActivo);
  }

  //Referencias al DOM
  const listaCarrito = document.getElementById("lista-carrito");
  const textoCarritoVacio = document.getElementById("carrito-vacio");

  const spanSubtotal = document.getElementById("subtotal");
  const spanDescuento = document.getElementById("descuento");
  const spanEnvio = document.getElementById("envio");
  const spanTotal = document.getElementById("total");

  const formCupon = document.getElementById("form-cupon");
  const inputCupon = document.getElementById("input-cupon");
  const mensajeCupon = document.getElementById("mensaje-cupon");

  const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
  const btnQuitarCupon = document.getElementById("btn-quitar-cupon");
  const btnCheckout = document.getElementById("btn-checkout");

  // Agregar al carrito
  function agregarAlCarrito(idProducto) {
    const producto = productos.find((p) => p.id === idProducto);
    if (!producto) return;

    let item = carrito.find((p) => p.id === idProducto);

    let mensaje;

    if (item) {
      item.cantidad++;
      mensaje = "Cantidad actualizada en el carrito";
    } else {
      carrito.push({ ...producto, cantidad: 1 });
      mensaje = "Producto agregado al carrito";
    }

    guardarEstadoCarrito();
    mostrarCarrito();
    actualizarContadorCarrito();

    Swal.close();
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `${producto.nombre}`,
      text: mensaje,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: "swal-toast",
      },
    });
  }
  //Mostrar el carrito
  function mostrarCarrito() {
    if (!listaCarrito || !textoCarritoVacio) return;

    listaCarrito.innerHTML = "";

    if (carrito.length === 0) {
      textoCarritoVacio.style.display = "block";
      actualizarTotales();
      return;
    }

    textoCarritoVacio.style.display = "none";

    carrito.forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("carrito-item");

      li.innerHTML = `
        <img src="${URL_BASE}${item.img}" alt="${item.nombre}">
        <div class="carrito-item-info">
          <h4>${item.nombre}</h4>
          <span>$${item.precio}</span>

          <div class="carrito-cantidad">
            <button class="btn-restar" data-id="${item.id}">-</button>
            <span>${item.cantidad}</span>
            <button class="btn-sumar" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="carrito-item-delete" data-id="${item.id}">✕</button>
      `;

      listaCarrito.appendChild(li);
    });

    activarBotonesCantidad();
    activarBotonesEliminar();
    actualizarTotales();
    actualizarContadorCarrito();
  }

  function activarBotonesCantidad() {
    document.querySelectorAll(".btn-sumar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        let item = carrito.find((p) => p.id === id);
        if (!item) return;
        item.cantidad++;
        guardarEstadoCarrito();
        mostrarCarrito();
      });
    });

    document.querySelectorAll(".btn-restar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        let item = carrito.find((p) => p.id === id);
        if (!item) return;

        if (item.cantidad > 1) {
          item.cantidad--;
        } else {
          carrito = carrito.filter((p) => p.id !== id);
        }
        guardarEstadoCarrito();
        mostrarCarrito();
        actualizarContadorCarrito();
      });
    });
  }

  function activarBotonesEliminar() {
    document.querySelectorAll(".carrito-item-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        carrito = carrito.filter((p) => p.id !== id);
        guardarEstadoCarrito();
        mostrarCarrito();
        actualizarContadorCarrito();
      });
    });
  }

  //Contadores y totales
  function actualizarTotales() {
    if (!spanSubtotal || !spanDescuento || !spanEnvio || !spanTotal) return;

    const { subtotal, descuento, envio, total } = calcularTotales(
      carrito,
      cuponActivo,
    );

    spanSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    spanDescuento.textContent =
      descuento > 0 ? `-$${descuento.toFixed(2)}` : "$0";
    spanEnvio.textContent = envio === 0 ? "GRATIS" : `$${envio.toFixed(2)}`;
    spanTotal.textContent = `$${total.toFixed(2)}`;
  }

  //Cupon
  formCupon?.addEventListener("submit", (e) => {
    e.preventDefault();

    const codigo = inputCupon.value.trim().toUpperCase();
    const subtotal = carrito.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0,
    );

    mensajeCupon.classList.remove("cupon-exito", "cupon-error");

    if (codigo === "PRIMERA15") {
      cuponActivo = true;
      mensajeCupon.textContent = "¡Cupón aplicado! 15% OFF 🎉";
      mensajeCupon.classList.add("cupon-exito");
    } else {
      cuponActivo = false;
      mensajeCupon.textContent = "Cupón inválido ❌";
      mensajeCupon.classList.add("cupon-error");
    }

    guardarEstadoCarrito();
    actualizarTotales();
  });

  // Vaciar carrito
  btnVaciarCarrito?.addEventListener("click", () => {
    carrito = [];
    cuponActivo = false;
    if (inputCupon) inputCupon.value = "";
    if (mensajeCupon) mensajeCupon.textContent = "";
    guardarEstadoCarrito();
    mostrarCarrito();
    actualizarContadorCarrito();
  });

  // Quitar cupón
  btnQuitarCupon?.addEventListener("click", () => {
    cuponActivo = false;
    if (inputCupon) inputCupon.value = "";
    if (mensajeCupon) {
      mensajeCupon.textContent = "Cupón eliminado.";
      mensajeCupon.style.color = "#b02a37";
    }
    guardarEstadoCarrito();
    actualizarTotales();
  });

  //Botones agregar
  const botonesAgregar = document.querySelectorAll(".btn-agregar");
  botonesAgregar.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      agregarAlCarrito(id);
    });
  });

  // Finalizar compra y checkout
  document.getElementById("btn-checkout")?.addEventListener("click", (e) => {
    e.preventDefault();

    const carritoLS = JSON.parse(localStorage.getItem("carrito")) || [];
    if (!carritoLS.length) {
      if (carrito.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Carrito vacío",
          text: "Agregá al menos un producto para finalizar la compra",
          confirmButtonText: "Ir a la tienda",

          confirmButtonColor: "#2E4C3F",
        }).then(() => {
          window.location.href = `${URL_BASE}pages/productos.html`; // o donde estén tus productos
        });
        return;
      }
      return;
    }

    window.location.href = `${URL_BASE}pages/checkout.html`;
  });

  // Incializacion
  mostrarCarrito();
  actualizarContadorCarrito();

  //Popup
  window.addEventListener("load", () => {
    const popupText = document.querySelector(".popup p");
    if (!popupText) return;

    let x = window.innerWidth * 0.4;
    const velocidad = 4;

    function moverTexto() {
      x -= velocidad;

      if (x < -popupText.offsetWidth) {
        x = window.innerWidth * 0.5;
      }

      popupText.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(moverTexto);
    }

    moverTexto();
  });

  //Favoritos
  favoritos = favoritos.map((f) => (typeof f === "object" ? f.id : f));
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  actualizarContadorFavoritos();

  const popupFav = document.getElementById("popup-favoritos");
  const listaFav = document.getElementById("lista-favoritos");
  const btnCerrarFav = document.getElementById("cerrar-popup-fav");
  const btnFavHeader = document.getElementById("btn-favoritos-header");

  function actualizarIconosFavoritos() {
    document.querySelectorAll(".card-producto").forEach((card) => {
      const id = card.dataset.id;
      const icon = card.querySelector(".btn-favorito i");
      if (!icon) return;

      if (favoritos.includes(id)) icon.classList.add("favorito-activo");
      else icon.classList.remove("favorito-activo");
    });
  }

  function abrirPopupFavoritos() {
    if (!popupFav || !listaFav) return;

    listaFav.innerHTML = "";

    if (favoritos.length === 0) {
      listaFav.innerHTML = `<li class="fav-empty">Aún no has agregado productos a favoritos.</li>`;
      popupFav.style.display = "flex";
      return;
    }

    favoritos.forEach((id) => {
      const card = document.querySelector(`.card-producto[data-id="${id}"]`);
      if (card) {
        const titulo = card.querySelector("h3").innerText;
        const img = card.querySelector("img").src;
        const desc = card.querySelector("p")?.innerText || "";
        const precio = card.querySelector(".precio")?.innerText || "";

        listaFav.innerHTML += `
          <li class="item-favorito">
            <div class="fav-img"><img src="${img}" alt="${titulo}"></div>
            <div class="fav-info">
              <h3>${titulo}</h3>
              <p>${desc}</p>
              <span class="fav-precio">${precio}</span>
            </div>
            <div class="fav-actions">
              <button class="btn-fav-add" data-id="${id}">
                <i class="fa fa-shopping-cart"></i><span>Add</span>
              </button>
              <button class="btn-fav-remove" data-id="${id}">
                <i class="fa fa-trash"></i><span>Remove</span>
              </button>
            </div>
          </li>
        `;
      }
    });

    if (!listaFav.innerHTML.trim()) {
      listaFav.innerHTML = `<li class="fav-empty">Aún no has agregado productos a favoritos.</li>`;
    }

    popupFav.style.display = "flex";
    activarBotonesFavoritos();
  }

  function activarBotonesFavoritos() {
    document.querySelectorAll(".btn-fav-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        favoritos = favoritos.filter((f) => f !== id);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        actualizarIconosFavoritos();
        abrirPopupFavoritos();
        actualizarContadorFavoritos();
      });
    });

    document.querySelectorAll(".btn-fav-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        agregarAlCarrito(id);
        abrirCarrito();
      });
    });
  }

  function cerrarPopupFavoritos() {
    if (!popupFav) return;
    popupFav.style.display = "none";
  }

  btnCerrarFav?.addEventListener("click", cerrarPopupFavoritos);

  btnFavHeader?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirPopupFavoritos();
  });

  document.querySelectorAll(".btn-favorito").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card-producto");
      const id = card.dataset.id;
      const nombre = card.querySelector("h3")?.innerText || "Producto";

      if (!favoritos.includes(id)) {
        favoritos.push(id);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        actualizarIconosFavoritos();
        actualizarContadorFavoritos();

        Swal.close();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: nombre,
          text: "Agregado a favoritos ❤️",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
          customClass: {
            popup: "swal-toast-fav",
          },
        });
      } else {
        favoritos = favoritos.filter((f) => f !== id);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        actualizarIconosFavoritos();
        actualizarContadorFavoritos();
      }
    });
  });

  actualizarIconosFavoritos();

  function actualizarContadorFavoritos() {
    favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    const favCount = document.getElementById("favoritos-count");
    if (!favCount) return;

    if (favoritos.length === 0) favCount.style.display = "none";
    else {
      favCount.style.display = "inline-block";
      favCount.innerText = favoritos.length;
    }
  }

  function actualizarContadorCarrito() {
    const cartCount = document.getElementById("carrito-count");
    if (!cartCount) return;

    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    cartCount.innerText = total;
    cartCount.style.display = total > 0 ? "inline-block" : "none";
  }

  //Chat flotante
  const chatFab = document.getElementById("chat-fab");
  const chatBox = document.getElementById("chat-box");
  const chatClose = document.getElementById("chat-close");
  const chatBody = document.getElementById("chat-body");

  chatFab?.addEventListener("click", () => {
    if (chatBox.style.display === "flex") chatBox.style.display = "none";
    else chatBox.style.display = "flex";
  });

  chatClose?.addEventListener("click", () => {
    chatBox.style.display = "none";
  });

  function agregarMensajeBot(text) {
    chatBody.innerHTML += `
      <div class="chat-row bot">
        <div class="chat-icon"><i class="fa-solid fa-ellipsis"></i></div>
        <div class="chat-bubble">${text}</div>
      </div>
    `;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function agregarMensajeUsuario(text) {
    chatBody.innerHTML += `
    <div class="chat-row user">
      <div class="chat-bubble">
        ${text}
      </div>
    </div>
  `;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function cargarOpcionesPrincipales() {
    const footer = document.querySelector(".chat-footer");

    footer.innerHTML = `
      <button class="chat-option">Pedidos</button>
      <button class="chat-option">Envíos</button>
      <button class="chat-option">Métodos de pago</button>
      <button class="chat-option">Otro</button>
    `;

    activarOpcionesPrincipales();
  }

  function activarOpcionesPrincipales() {
    document.querySelectorAll(".chat-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const opcion = btn.innerText.trim();
        agregarMensajeUsuario(opcion);

        const footer = document.querySelector(".chat-footer");

        if (opcion === "Pedidos") {
          agregarMensajeBot("Claro, elegí una opción 👇");

          footer.innerHTML = `
            <button class="sub-option">◀ Volver</button>
            <button class="sub-option">¿Cuánto demora mi pedido?</button>
            <button class="sub-option">¿Cómo va mi pedido?</button>
            <button class="sub-option">Horario de entrega</button>
          `;

          activarSubOpciones();
          return;
        }

        if (opcion === "Envíos") {
          agregarMensajeBot(
            "Realizamos envíos a todo el país 🚚. " +
              "El envío dentro de Montevideo cuesta $150 y se coordina con el cliente una vez finalizado y pronto para entregar el pedido. Si la compra es mayor a $1500 tenés envío gratis!!!" +
              "Los envíos fuera de Montevideo se realizan por agencia y es a elección del cliente.",
          );
          return;
        }

        if (opcion === "Métodos de pago") {
          agregarMensajeBot(
            "Aceptamos transferencia bancaria, MercadoPago y efectivo. " +
              "También podemos coordinar otros métodos según disponibilidad.",
          );
          return;
        }

        if (opcion === "Otro") {
          agregarMensajeBot(
            "Podés contarnos por Whatsapp qué necesitás y te ayudaremos lo antes posible. 😊",
          );
          return;
        }
      });
    });
  }

  function activarSubOpciones() {
    document.querySelectorAll(".sub-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pregunta = btn.innerText.trim();
        agregarMensajeUsuario(pregunta);

        if (pregunta === "◀ Volver") {
          agregarMensajeBot("Claro, ¿en qué más puedo ayudarte? 😊");
          cargarOpcionesPrincipales();
          return;
        }

        if (pregunta === "¿Cuánto demora mi pedido?") {
          agregarMensajeBot(
            "Los pedidos personalizados tienen demora dependiendo del producto y de la cantidad. " +
              "Comunícate con nosotros por Whatsapp y te informamos la demora exacta de tu pedido. 😊",
          );
        }

        if (pregunta === "¿Cómo va mi pedido?") {
          agregarMensajeBot(
            "Podemos revisarlo por vos. Envíanos tu nombre o número de pedido. 💬",
          );
        }

        if (pregunta === "Horario de entrega") {
          agregarMensajeBot(
            "Las entregas se realizan entre las 10:00 y las 19:00. " +
              "Coordinamos horario exacto por WhatsApp.",
          );
        }
      });
    });
  }

  activarOpcionesPrincipales();

  // Barra buscadora
  const formBuscador = document.querySelector(".barra-buscadora");
  const inputBuscador = formBuscador?.querySelector("input");

  formBuscador?.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  inputBuscador?.addEventListener("input", () => {
    const texto = inputBuscador.value.toLowerCase().trim();

    document.querySelectorAll(".card-producto").forEach((card) => {
      const nombre = card.querySelector("h3")?.innerText.toLowerCase() || "";

      if (nombre.includes(texto)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  });
});
