// Capa fina de interfaz: lee lo que hace el usuario, llama a la lista de Tareas
// y vuelve a pintar. Sin lógica de negocio.
(function () {
  // Algunos navegadores bloquean el almacenamiento local (por ejemplo, desde
  // file:// con cierta configuración); en ese caso la app funciona en memoria.
  function almacenamientoDelNavegador() {
    try {
      return window.localStorage;
    } catch {
      const datos = {};
      return {
        getItem: (clave) => (clave in datos ? datos[clave] : null),
        setItem: (clave, valor) => {
          datos[clave] = String(valor);
        },
      };
    }
  }

  const lista = crearListaDeTareas(almacenamientoDelNavegador());
  const formulario = document.getElementById("formulario-agregar");
  const campo = document.getElementById("texto-tarea");
  const elementoLista = document.getElementById("lista");
  const contador = document.getElementById("contador");
  const botonesDeVista = document.querySelectorAll("#vistas button");
  const vistaVacia = document.getElementById("vista-vacia");
  const botonExportar = document.getElementById("exportar");

  const MENSAJE_DE_VISTA_VACIA = {
    todas: "No hay Tareas.",
    pendientes: "No hay Tareas pendientes.",
    hechas: "No hay Tareas hechas.",
  };

  // La vista activa es estado de la interfaz: no se guarda.
  let vista = "todas";

  // La Tarea visible siguiente, o la anterior si era la última.
  function vecinaVisible(id) {
    const ids = lista.tareas(vista).map((tarea) => tarea.id);
    const posicion = ids.indexOf(id);
    return ids[posicion + 1] || ids[posicion - 1];
  }

  // Al repintar se pierde el foco: se devuelve a un control de la Tarea
  // indicada para que quien usa el teclado no tenga que volver a buscarlo.
  // Si la Tarea ya no está visible, el foco va al campo de texto.
  function enfocar(id, selectorDelControl) {
    const control =
      id &&
      elementoLista.querySelector(`li[data-id="${id}"] ${selectorDelControl}`);
    if (control) control.focus();
    else campo.focus();
  }

  function elementoDeTarea(tarea) {
    const elemento = document.createElement("li");
    elemento.dataset.id = tarea.id;
    elemento.dataset.estado = tarea.estado;

    const etiqueta = document.createElement("label");
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.checked = tarea.estado === "hecha";
    casilla.addEventListener("change", () => {
      // Si al cambiar de estado la Tarea sale de la vista activa, el foco pasa
      // a la casilla de la Tarea vecina visible.
      const vecina = vecinaVisible(tarea.id);
      lista.cambiarEstado(tarea.id);
      pintar();
      const sigueVisible = lista.tareas(vista).some((otra) => otra.id === tarea.id);
      enfocar(sigueVisible ? tarea.id : vecina, 'input[type="checkbox"]');
    });
    const texto = document.createElement("span");
    texto.textContent = tarea.texto;
    etiqueta.append(casilla, texto);

    const botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.className = "borrar";
    botonBorrar.textContent = "Borrar";
    botonBorrar.setAttribute("aria-label", `Borrar «${tarea.texto}»`);
    botonBorrar.addEventListener("click", () => {
      // Tras borrar, el foco pasa al botón «Borrar» de la Tarea vecina visible.
      const vecina = vecinaVisible(tarea.id);
      lista.borrar(tarea.id);
      pintar();
      enfocar(vecina, "button.borrar");
    });

    elemento.append(etiqueta, botonBorrar);
    return elemento;
  }

  function pintar() {
    const visibles = lista.tareas(vista);
    elementoLista.replaceChildren(...visibles.map(elementoDeTarea));
    vistaVacia.textContent = MENSAJE_DE_VISTA_VACIA[vista];
    vistaVacia.hidden = visibles.length > 0;
    botonesDeVista.forEach((boton) => {
      boton.setAttribute("aria-pressed", String(boton.dataset.vista === vista));
    });
    const pendientes = lista.pendientes();
    contador.textContent =
      pendientes === 1 ? "1 Tarea pendiente" : `${pendientes} Tareas pendientes`;
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const antes = lista.tareas().length;
    lista.agregar(campo.value);
    if (lista.tareas().length > antes) {
      campo.value = "";
      pintar();
    }
    campo.focus();
  });

  botonesDeVista.forEach((boton) => {
    boton.addEventListener("click", () => {
      vista = boton.dataset.vista;
      pintar();
    });
  });

  // Guarda en un archivo el texto de exportar() mediante un enlace temporal;
  // no cambia la lista ni la Vista, así que no hace falta repintar.
  botonExportar.addEventListener("click", () => {
    const contenido = new Blob([lista.exportar()], { type: "application/json" });
    const url = URL.createObjectURL(contenido);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "lista-de-tareas.json";
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });

  pintar();
})();
