# HEARTAGRAM Redesign Wireframes

These wireframes define hierarchy and behavior. They do not prescribe final typography, iconography, or decorative treatment.

## Application shell - expanded desktop

```text
+--------------------+--------------------------------------------------+
| HEARTAGRAM         |                                                  |
|                    |                                                  |
| Inicio             |                   CONTENT                        |
| Descubrir          |                                                  |
| Explorar           |                                                  |
| Mi lista           |                                                  |
| Chat               |                                                  |
|                    |                                                  |
| ------------------ |                                                  |
| Mi perfil          |                                                  |
| Mi regalo          |                                                  |
|                    |                                                  |
| [Collapse]         |                                                  |
+--------------------+--------------------------------------------------+
```

## Application shell - mobile

```text
+----------------------------------------------------------+
| Screen heading                                           |
+----------------------------------------------------------+
|                                                          |
|                         CONTENT                          |
|                                                          |
+----------------------------------------------------------+
| Inicio | Descubrir | Explorar | Mi lista | Chat          |
+----------------------------------------------------------+
```

## Inicio - returning profile

```text
+----------------------------------------------------------+
| PARA ADRI                                  Mi regalo      |
|                                                          |
| HEARTAGRAM                                               |
| Tu proxima aventura empieza aqui.                        |
|                                                          |
| +------------------------------------------------------+ |
| | CONTINUAR                                            | |
| | Mario Kart World                                    | |
| | Para una partida rapida con Inti.      [Ver juego] | |
| +------------------------------------------------------+ |
|                                                          |
| +-------------------------+ +--------------------------+ |
| | TU PERFIL               | | PARA HOY                | |
| | La Errante              | | Dredge                  | |
| | La de la Grieta         | | Oscuro / Exploracion    | |
| | [Ver perfil]            | | [Ver por que]           | |
| +-------------------------+ +--------------------------+ |
|                                                          |
| TU ESPACIO                                               |
| [4 Me interesa] [3 Biblioteca] [Jugar con Inti]         |
|                                                          |
| [Mi regalo] [Rehacer test] [Grupo familiar]             |
+----------------------------------------------------------+
```

## Inicio - no profile

```text
+----------------------------------------------------------+
| HEARTAGRAM                                               |
|                                                          |
| Descubre que tipo de jugadora eres.                      |
| Doce elecciones rapidas para comenzar.                   |
|                                                          |
| [Descubrir mi perfil]                                    |
|                                                          |
| [Explorar juegos] [Ver mi regalo]                        |
+----------------------------------------------------------+
```

## Descubrir

```text
+----------------------------------------------------------+
| DESCUBRIR                                                |
| Recomendaciones construidas alrededor de como juegas.    |
|                                                          |
| +------------------------------------------------------+ |
| | TU PERFIL                                           | |
| | La Errante / La de la Grieta                       | |
| | Exploracion  ########--                             | |
| | Reto         ######----                             | |
| | Oscuridad    #######---                             | |
| | [Perfil completo] [Rehacer test]                   | |
| +------------------------------------------------------+ |
|                                                          |
| PARA TI                                                  |
| [Game card] [Game card] [Game card]                     |
|                                                          |
| SEGUN TU MOOD                                            |
| [Oscuro] [Relajado] [Competitivo] [Explorar]            |
|                                                          |
| PARA JUGAR CON INTI                                      |
| [Game card] [Game card] [Game card]                     |
|                                                          |
| SAL DE TU ZONA                                           |
| [Featured recommendation]                                |
+----------------------------------------------------------+
```

## Mi lista

```text
+----------------------------------------------------------+
| MI LISTA                                                 |
| Tu espacio para decidir que jugar despues.               |
|                                                          |
| [Me interesa 4] [Mi biblioteca 3]                        |
|                                                          |
| Show: [All] [Dark] [With Inti]                           |
| Sort: [Recently added]                                   |
|                                                          |
| +------------------------------------------------------+ |
| | COVER | Dredge                                      | |
| |       | Exploracion / Oscuro                        | |
| |       | Why it might fit...                         | |
| |       | [Details] [I own it] [Remove]              | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

## Chat - desktop

```text
+------------------+----------------------+--------------------------+
| APP NAVIGATION   | CONVERSATIONS        | CHAT                     |
|                  |                      |                          |
| Inicio           | + Nueva              | HEARTAGRAM               |
| Descubrir        |                      |                          |
| Explorar         | Que jugar primero    | Using:                   |
| Mi lista         | Algo oscuro          | [Profile] [List] [Owned] |
| Chat             | Para jugar con Inti  |                          |
|                  |                      | HEARTAGRAM               |
| ---------------- |                      | Que te gustaria jugar?   |
| Mi perfil        |                      |                          |
| Mi regalo        |                      | ADRI                     |
|                  |                      | Quiero algo oscuro...    |
| [Collapse]       |                      |                          |
|                  |                      | HEARTAGRAM               |
|                  |                      | Recommendation + card    |
|                  |                      |                          |
|                  |                      +--------------------------+
|                  |                      | Message...           Up  |
+------------------+----------------------+--------------------------+
```

## Chat - empty conversation

```text
HEARTAGRAM

Que te gustaria jugar?

[Elige algo de Mi lista]
[Algo para jugar con Inti]
[Quiero algo oscuro]
[Quiero probar algo diferente]

[Message............................................. Up]
```
