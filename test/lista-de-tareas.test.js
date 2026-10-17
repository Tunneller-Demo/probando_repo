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
