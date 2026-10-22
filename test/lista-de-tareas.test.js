const { test } = require("node:test");
const assert = require("node:assert/strict");
const { crearListaDeTareas } = require("../src/lista-de-tareas.js");

function almacenamientoEnMemoria(inicial = {}) {
  const datos = { ...inicial };
  return {
    getItem: (clave) => (clave in datos ? datos[clave] : null),
    setItem: (clave, valor) => {
      datos[clave] = String(valor);
    },
    claves: () => Object.keys(datos),
  };
}

// La clave donde la lista guarda sus Tareas, sin depender de su nombre.
function claveDeLaLista() {
  const almacenamiento = almacenamientoEnMemoria();
  crearListaDeTareas(almacenamiento).agregar("x");
  const [clave] = almacenamiento.claves();
  return clave;
}

function textos(lista) {
  return lista.tareas().map((tarea) => tarea.texto);
}

test("agregar una Tarea la deja Pendiente en la lista", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.agregar("Comprar pan");

  assert.deepEqual(
    lista.tareas().map(({ texto, estado }) => ({ texto, estado })),
    [{ texto: "Comprar pan", estado: "pendiente" }],
  );
});

test("agregar recorta los espacios del texto", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.agregar("   Llamar a Ana  ");

  assert.deepEqual(textos(lista), ["Llamar a Ana"]);
});

test("agregar un texto vacío o solo con espacios no crea ninguna Tarea", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.agregar("");
  lista.agregar("    ");

  assert.deepEqual(textos(lista), []);
});

test("se admiten Tareas con el mismo texto, cada una con su identificador", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.agregar("Regar");
  lista.agregar("Regar");

  const [primera, segunda] = lista.tareas();
  assert.deepEqual(textos(lista), ["Regar", "Regar"]);
  assert.ok(primera.id);
  assert.notEqual(primera.id, segunda.id);
});

test("las Tareas se devuelven en orden de creación", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.agregar("Primera");
  lista.agregar("Segunda");
  lista.agregar("Tercera");

  assert.deepEqual(textos(lista), ["Primera", "Segunda", "Tercera"]);
});

test("las Tareas agregadas siguen ahí al volver a abrir la lista", () => {
  const almacenamiento = almacenamientoEnMemoria();
  const lista = crearListaDeTareas(almacenamiento);
  lista.agregar("Primera");
  lista.agregar("Segunda");

  const reabierta = crearListaDeTareas(almacenamiento);

  assert.deepEqual(reabierta.tareas(), lista.tareas());
  assert.deepEqual(textos(reabierta), ["Primera", "Segunda"]);
});

test("la lista arranca vacía si no hay nada guardado", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  assert.deepEqual(lista.tareas(), []);
});

for (const [caso, guardado] of [
  ["JSON no válido", "{esto no es json"],
  ["un valor que no es una lista", '{"texto":"Hola"}'],
  ["null", "null"],
  ["elementos sin la forma de una Tarea", '[{"texto":42},"suelto",null]'],
]) {
  test(`la lista arranca vacía si lo guardado es ${caso}`, () => {
    const dañado = almacenamientoEnMemoria({ [claveDeLaLista()]: guardado });

    const lista = crearListaDeTareas(dañado);

    assert.deepEqual(lista.tareas(), []);
  });
}

function estados(lista) {
  return lista.tareas().map((tarea) => tarea.estado);
}

test("cambiar el estado de una Tarea Pendiente la deja Hecha, y otra vez Pendiente", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Comprar pan");
  const [tarea] = lista.tareas();

  lista.cambiarEstado(tarea.id);
  assert.deepEqual(estados(lista), ["hecha"]);

  lista.cambiarEstado(tarea.id);
  assert.deepEqual(estados(lista), ["pendiente"]);
});

test("cambiar el estado de una Tarea no afecta a otra con el mismo texto", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Regar");
  lista.agregar("Regar");
  const [primera] = lista.tareas();

  lista.cambiarEstado(primera.id);

  assert.deepEqual(estados(lista), ["hecha", "pendiente"]);
});

test("cambiar el estado de una Tarea que no existe no cambia nada", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Regar");

  lista.cambiarEstado("no-existe");

  assert.deepEqual(estados(lista), ["pendiente"]);
});

test("el estado de una Tarea se conserva al volver a abrir la lista", () => {
  const almacenamiento = almacenamientoEnMemoria();
  const lista = crearListaDeTareas(almacenamiento);
  lista.agregar("Primera");
  lista.agregar("Segunda");
  lista.cambiarEstado(lista.tareas()[1].id);

  const reabierta = crearListaDeTareas(almacenamiento);

  assert.deepEqual(estados(reabierta), ["pendiente", "hecha"]);
});

test("el conteo de Pendientes no incluye las Hechas", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  assert.equal(lista.pendientes(), 0);

  lista.agregar("Una");
  lista.agregar("Dos");
  lista.agregar("Tres");
  lista.cambiarEstado(lista.tareas()[0].id);

  assert.equal(lista.pendientes(), 2);
});

test("borrar una Tarea la quita y deja las demás en orden", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Una");
  lista.agregar("Dos");
  lista.agregar("Tres");

  lista.borrar(lista.tareas()[1].id);

  assert.deepEqual(textos(lista), ["Una", "Tres"]);
});

test("borrar una Tarea no borra otra con el mismo texto", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Regar");
  lista.agregar("Regar");
  const [primera, segunda] = lista.tareas();

  lista.borrar(primera.id);

  assert.deepEqual(lista.tareas(), [segunda]);
});

test("una Tarea borrada no vuelve al abrir otra vez la lista", () => {
  const almacenamiento = almacenamientoEnMemoria();
  const lista = crearListaDeTareas(almacenamiento);
  lista.agregar("Se queda");
  lista.agregar("Se va");
  lista.borrar(lista.tareas()[1].id);

  const reabierta = crearListaDeTareas(almacenamiento);

  assert.deepEqual(textos(reabierta), ["Se queda"]);
});

test("borrar una Pendiente baja el conteo y borrar una Hecha no lo cambia", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Pendiente 1");
  lista.agregar("Pendiente 2");
  lista.agregar("Hecha");
  const [pendiente, , hecha] = lista.tareas();
  lista.cambiarEstado(hecha.id);

  lista.borrar(hecha.id);
  assert.equal(lista.pendientes(), 2);

  lista.borrar(pendiente.id);
  assert.equal(lista.pendientes(), 1);
});

test("borrar una Tarea que no existe no cambia nada", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Regar");

  lista.borrar("no-existe");

  assert.deepEqual(textos(lista), ["Regar"]);
});

function listaConEstadosMezclados() {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Una");
  lista.agregar("Dos");
  lista.agregar("Tres");
  const [una, , tres] = lista.tareas();
  lista.cambiarEstado(una.id);
  lista.cambiarEstado(tres.id);
  return lista;
}

function textosDeLaVista(lista, vista) {
  return lista.tareas(vista).map((tarea) => tarea.texto);
}

test("cada vista devuelve sus Tareas en orden de creación", () => {
  const lista = listaConEstadosMezclados();

  assert.deepEqual(textosDeLaVista(lista, "todas"), ["Una", "Dos", "Tres"]);
  assert.deepEqual(textosDeLaVista(lista, "pendientes"), ["Dos"]);
  assert.deepEqual(textosDeLaVista(lista, "hechas"), ["Una", "Tres"]);
});

test("sin vista, o con una vista desconocida, se devuelven todas las Tareas", () => {
  const lista = listaConEstadosMezclados();

  assert.deepEqual(lista.tareas(), lista.tareas("todas"));
  assert.deepEqual(lista.tareas("otra"), lista.tareas("todas"));
});

test("una Tarea marcada como Hecha pasa de la vista Pendientes a la vista Hechas", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Regar");
  const [tarea] = lista.tareas("pendientes");

  lista.cambiarEstado(tarea.id);

  assert.deepEqual(textosDeLaVista(lista, "pendientes"), []);
  assert.deepEqual(textosDeLaVista(lista, "hechas"), ["Regar"]);
});

test("se puede seguir agregando aunque el almacenamiento falle al escribir", () => {
  const lista = crearListaDeTareas({
    getItem: () => null,
    setItem: () => {
      throw new Error("almacenamiento lleno");
    },
  });

  lista.agregar("Sin guardar");

  assert.deepEqual(textos(lista), ["Sin guardar"]);
});

test("exportar devuelve todas las Tareas en orden, solo con texto y estado", () => {
  const lista = listaConEstadosMezclados();

  assert.deepEqual(JSON.parse(lista.exportar()), [
    { texto: "Una", estado: "hecha" },
    { texto: "Dos", estado: "pendiente" },
    { texto: "Tres", estado: "hecha" },
  ]);
});

test("exportar no cambia la lista", () => {
  const lista = listaConEstadosMezclados();
  const antes = lista.tareas();

  lista.exportar();

  assert.deepEqual(lista.tareas(), antes);
  assert.equal(lista.pendientes(), 1);
});

test("exportar una lista vacía devuelve una lista JSON vacía", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  assert.deepEqual(JSON.parse(lista.exportar()), []);
});

test("se puede exportar aunque el almacenamiento falle", () => {
  const lista = crearListaDeTareas({
    getItem: () => {
      throw new Error("almacenamiento bloqueado");
    },
    setItem: () => {
      throw new Error("almacenamiento bloqueado");
    },
  });
  lista.agregar("En memoria");

  assert.deepEqual(JSON.parse(lista.exportar()), [
    { texto: "En memoria", estado: "pendiente" },
  ]);
});

const nuncaConfirmar = () => {
  throw new Error("no debía pedir confirmación");
};

test("exportar e importar en otra lista deja las mismas Tareas, orden y estado", () => {
  const origen = listaConEstadosMezclados();
  const destino = crearListaDeTareas(almacenamientoEnMemoria());

  const resultado = destino.importar(origen.exportar(), nuncaConfirmar);

  assert.deepEqual(resultado, { resultado: "importado", cantidad: 3 });
  assert.deepEqual(JSON.parse(destino.exportar()), JSON.parse(origen.exportar()));
  assert.equal(destino.pendientes(), 1);
});

test("importar sobre una lista con Tareas pide confirmación con N y M y, si se acepta, la sustituye", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());
  lista.agregar("Vieja");
  const llamadas = [];

  const resultado = lista.importar(
    '[{"texto":"Nueva 1","estado":"hecha"},{"texto":"Nueva 2","estado":"pendiente"}]',
    (actuales, delArchivo) => {
      llamadas.push([actuales, delArchivo]);
      return true;
    },
  );

  assert.deepEqual(llamadas, [[1, 2]]);
  assert.deepEqual(resultado, { resultado: "importado", cantidad: 2 });
  assert.deepEqual(textos(lista), ["Nueva 1", "Nueva 2"]);
});

test("si se cancela la confirmación, la lista y el almacenamiento quedan intactos", () => {
  const almacenamiento = almacenamientoEnMemoria();
  const lista = crearListaDeTareas(almacenamiento);
  lista.agregar("Se queda");
  const antes = lista.tareas();
  let escrituras = 0;
  const setItem = almacenamiento.setItem;
  almacenamiento.setItem = (clave, valor) => {
    escrituras += 1;
    setItem(clave, valor);
  };

  const resultado = lista.importar('[{"texto":"Otra","estado":"hecha"}]', () => false);

  assert.deepEqual(resultado, { resultado: "cancelado" });
  assert.deepEqual(lista.tareas(), antes);
  assert.equal(escrituras, 0);
  assert.deepEqual(crearListaDeTareas(almacenamiento).tareas(), antes);
});

test("importar recorta el texto de cada Tarea como al agregar", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  lista.importar('[{"texto":"  Regar  ","estado":"pendiente"}]', nuncaConfirmar);

  assert.deepEqual(textos(lista), ["Regar"]);
});

test("las Tareas importadas tienen identificadores distintos, persisten y se pueden cambiar y borrar", () => {
  const almacenamiento = almacenamientoEnMemoria();
  crearListaDeTareas(almacenamiento).importar(
    '[{"texto":"Regar","estado":"pendiente"},{"texto":"Regar","estado":"hecha"},{"texto":"Leer","estado":"pendiente"}]',
    nuncaConfirmar,
  );

  const reabierta = crearListaDeTareas(almacenamiento);
  const [primera, segunda, tercera] = reabierta.tareas();
  assert.equal(new Set([primera.id, segunda.id, tercera.id]).size, 3);
  assert.deepEqual(estados(reabierta), ["pendiente", "hecha", "pendiente"]);

  reabierta.cambiarEstado(primera.id);
  reabierta.borrar(tercera.id);

  assert.deepEqual(estados(reabierta), ["hecha", "hecha"]);
  assert.equal(reabierta.pendientes(), 0);
});

test("un archivo con campos de más, como identificadores, se importa", () => {
  const lista = crearListaDeTareas(almacenamientoEnMemoria());

  const resultado = lista.importar(
    '[{"id":"x","texto":"Una","estado":"hecha","color":"rojo"},{"id":"x","texto":"Dos","estado":"pendiente"}]',
    nuncaConfirmar,
  );

  assert.deepEqual(resultado, { resultado: "importado", cantidad: 2 });
  assert.deepEqual(
    lista.tareas().map(({ texto, estado }) => ({ texto, estado })),
    [
      { texto: "Una", estado: "hecha" },
      { texto: "Dos", estado: "pendiente" },
    ],
  );
  const [una, dos] = lista.tareas();
  assert.notEqual(una.id, dos.id);
  assert.notEqual(una.id, "x");
});
