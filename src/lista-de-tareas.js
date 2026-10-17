// Lista de Tareas: lógica pura, sin DOM. Recibe un almacenamiento con la forma
// del almacenamiento local del navegador (getItem/setItem).
// Es un script clásico para que funcione abriendo index.html desde file://,
// donde los módulos ES no cargan en todos los navegadores.
(function (global) {
  let contador = 0;

  function nuevoId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    contador += 1;
    return `${Date.now().toString(36)}-${contador}`;
  }

  const CLAVE = "lista-de-tareas";

  function esTarea(valor) {
    return (
      valor !== null &&
      typeof valor === "object" &&
      typeof valor.id === "string" &&
      typeof valor.texto === "string" &&
      (valor.estado === "pendiente" || valor.estado === "hecha")
    );
  }

  // Si falta lo guardado o no tiene la forma esperada, se empieza de cero.
  function cargar(almacenamiento) {
    try {
      const guardado = JSON.parse(almacenamiento.getItem(CLAVE));
      return Array.isArray(guardado) && guardado.every(esTarea) ? guardado : [];
    } catch {
      return [];
    }
  }

  // Si el almacenamiento falla (lleno, bloqueado), la app sigue funcionando
  // con lo que tiene en memoria.
  function guardar(almacenamiento, tareas) {
    try {
      almacenamiento.setItem(CLAVE, JSON.stringify(tareas));
    } catch {}
  }

  function crearListaDeTareas(almacenamiento) {
    const tareas = cargar(almacenamiento);

    return {
      agregar(texto) {
        const limpio = String(texto).trim();
        if (limpio === "") return;
        tareas.push({ id: nuevoId(), texto: limpio, estado: "pendiente" });
        guardar(almacenamiento, tareas);
      },
      cambiarEstado(id) {
        const tarea = tareas.find((candidata) => candidata.id === id);
        if (!tarea) return;
        tarea.estado = tarea.estado === "pendiente" ? "hecha" : "pendiente";
        guardar(almacenamiento, tareas);
      },
      tareas() {
        return tareas.map((tarea) => ({ ...tarea }));
      },
      pendientes() {
        return tareas.filter((tarea) => tarea.estado === "pendiente").length;
      },
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { crearListaDeTareas };
  } else {
    global.crearListaDeTareas = crearListaDeTareas;
  }
})(globalThis);
