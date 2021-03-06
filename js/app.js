(function (window, angular, undefined) {
    'use strict';



    /*
     * Constantes
     * 
     * Estas constantes no influencian el tamaño en sí de los elementos, sólo son usadas como referencia para los cálculos de posición y detección de colisión
     * 
     * Posible TO-DO: Redefinir tamaño de elementos CSS según estas constantes
     */
    const ANCHO = 600,
        ALTO = 400;

    const ANCHO_PAD = 15,
        ALTO_PAD = 80;

    const TAMANO_BOLA = 20;

    const LIMITE_INFERIOR_PAD = ALTO - ALTO_PAD,
        LIMITE_INFERIOR_BOLA = ALTO - TAMANO_BOLA,
        LIMITE_DERECHO_BOLA = ANCHO - TAMANO_BOLA;

    /* Las constantes de velocidad SI pueden ser cambiadas sin problemas */

    const VELOCIDAD_PAD = 4,
        VELOCIDAD_BOLA = 5;

    /*
     * Variables encapsuladas
     */
    var animationFrameId;



    /*
     *  Crear aplicación angular
     */
    var app = angular.module('PongApp', []);



    /*
     *  Crear controlador angular
     */
    app.controller('PongController', ['$scope', function ($scope) {

        // Objeto privado - fuera del scope
        // Objeto que contiene las teclas y su estatus (true: presionada, false o undefined: no presionada)
        var keys = {};

        // Inicializar variables del scope
        // Altura de los pads
        $scope.alturaPad1 = (ALTO - ALTO_PAD) / 2;
        $scope.alturaPad2 = (ALTO - ALTO_PAD) / 2;

        // Posicion vertical de los pads
        // Asegurarse que ambos queden a la misma distancia de la pared detrás de ellos
        $scope.izquierda = 10;
        $scope.derecha = ANCHO - ANCHO_PAD - 10;

        // Velocidad de pads (inicializada a 0)
        $scope.velocidadPad1 = 0;
        $scope.velocidadPad2 = 0;

        // Definir propiedades de bola (objetos de posición y velocidad)
        $scope.posicionBola = {};
        $scope.velocidadBola = {};

        /**
         * Inicializa la bola al centro de la cancha, y le da una dirección al azar
         * Esta función será rellamada cada vez que se anote un punto pare reinicializar la bola
         */
        $scope.resetearBola = function () {
            // Coordenadas de la bola - centro de la cancha
            $scope.posicionBola = {
                x: ANCHO / 2,
                y: ALTO / 2
            };

            // Velocidad de la bola - dirección aleatoria (uno de los 4 diagonales)
            $scope.velocidadBola = {
                x: (Math.random() > 0.5) ? VELOCIDAD_BOLA : -VELOCIDAD_BOLA,
                y: (Math.random() > 0.5) ? VELOCIDAD_BOLA : -VELOCIDAD_BOLA
            };
        };

        // Jugadores (el nombre se preguntará después)
        $scope.jugador1 = "";
        $scope.jugador2 = "";

        // Puntajes
        $scope.puntaje1 = 0;
        $scope.puntaje2 = 0;



        /**
         * Animation Frame - función a ser llamada en cada frame de animacion (60 veces por segundo)
         * Incluída en el $scope para tener acceso a las demás variables del scope
         */
        $scope.animationFrame = function () {

            // Aplicar velocidad a pads
            // Flecha Arriba / Flecha Abajo: mover pad 1 (izquierda)
            if (keys.ArrowUp) $scope.velocidadPad1 = -VELOCIDAD_PAD;
            if (keys.ArrowDown) $scope.velocidadPad1 = VELOCIDAD_PAD;
            // W / S : mover pad 2 (derecha)
            if (keys.w) $scope.velocidadPad2 = -VELOCIDAD_PAD;
            if (keys.s) $scope.velocidadPad2 = VELOCIDAD_PAD;

            // Mover pads segun velocidad
            $scope.alturaPad1 += $scope.velocidadPad1;
            $scope.alturaPad2 += $scope.velocidadPad2;

            // Reducir velocidad por fricción
            // La velocidad se va a reducir en 1 hasta volver a 0
            if ($scope.velocidadPad1 !== 0) $scope.velocidadPad1 -= Math.sign($scope.velocidadPad1);
            if ($scope.velocidadPad2 !== 0) $scope.velocidadPad2 -= Math.sign($scope.velocidadPad2);

            // Limitar movimiento vertical de pads al tablero
            if ($scope.alturaPad1 < 0) $scope.alturaPad1 = 0;
            if ($scope.alturaPad2 < 0) $scope.alturaPad2 = 0;
            if ($scope.alturaPad1 > LIMITE_INFERIOR_PAD) $scope.alturaPad1 = LIMITE_INFERIOR_PAD;
            if ($scope.alturaPad2 > LIMITE_INFERIOR_PAD) $scope.alturaPad2 = LIMITE_INFERIOR_PAD;

            // Mover la bola según su velocidad
            $scope.posicionBola.x += $scope.velocidadBola.x;
            $scope.posicionBola.y += $scope.velocidadBola.y;

            // Rebotar la bola con bordes superior/inferior
            if ($scope.posicionBola.y <= 0) $scope.velocidadBola.y = -$scope.velocidadBola.y;
            if ($scope.posicionBola.y >= LIMITE_INFERIOR_BOLA) $scope.velocidadBola.y = -$scope.velocidadBola.y;

            // Resetear bola si choca con los bordes izquierdo/derecho
            // E incrementar puntaje del jugador que anotó el punto
            if ($scope.posicionBola.x < 0) {
                // Bola salió por la izquierda - jugador 2 anotó
                $scope.puntaje2++;
                $scope.resetearBola();
            }
            if ($scope.posicionBola.x > LIMITE_DERECHO_BOLA) {
                // Bola salió por la derecha - jugador 1 anotó
                $scope.puntaje1++;
                $scope.resetearBola();
            }

            // Detectar colisión de bola con pads
            // Pad izquierdo - rebota a la derecha (vel. positiva)
            if (($scope.posicionBola.x <= ($scope.izquierda + ANCHO_PAD)))
                if (($scope.posicionBola.y >= $scope.alturaPad1) && ($scope.posicionBola.y <= ($scope.alturaPad1 + ALTO_PAD))) {
                    $scope.velocidadBola.x = VELOCIDAD_BOLA;
                    // imprimir parte de la velocidad vertical del pad a la bola
                    $scope.velocidadBola.y += ($scope.velocidadPad1 / 2);
                }

            // Pad derecho - rebota a la izquierda (vel. negativa)
            if ((($scope.posicionBola.x + ANCHO_PAD) >= $scope.derecha))
                if (($scope.posicionBola.y >= $scope.alturaPad2) && ($scope.posicionBola.y <= ($scope.alturaPad2 + ALTO_PAD))) {
                    $scope.velocidadBola.x = -VELOCIDAD_BOLA;
                    // imprimir parte de la velocidad vertical del pad a la bola
                    $scope.velocidadBola.y += ($scope.velocidadPad2 / 2);
                }

            // Aplicar los cambios para que se reflejen en las directivas
            $scope.$apply();

            // Solicitar un nuevo Animation Frame
            animationFrameId = window.requestAnimationFrame($scope.animationFrame);
        };



        /* Crear event listeners
         * Escuchar los eventos keydown y keyup para tener un registro de que teclas estan siendo o no presionadas
         */
        window.document.addEventListener('keydown', (evt) => {
            // Registrar keydown (true = tecla presionada)
            keys[evt.key] = true;
        });

        window.document.addEventListener('keyup', (evt) => {
            // Registrar keydown (false = tecla no presionada)
            keys[evt.key] = false;
        });

        // Definir funcion a llamar cuando todo esté listo
        angular.element(document).ready(() => {
            // Inicializar bola
            $scope.resetearBola();

            // Preguntar nombres
            $scope.jugador1 = window.prompt("Ingresa el nombre del jugador 1:");
            $scope.jugador2 = window.prompt("Ingresa el nombre del jugador 2:");

            // Sacar class invisible al score para mostrarlo una vez que se hayan ingresado los nombres
            window.document.getElementById("scoreboard").classList.remove("invisible");

            // Llamar al primer animation frame
            animationFrameId = window.requestAnimationFrame($scope.animationFrame);
        });



    }]);



    /*
     *  Directiva pad
     */

    app.directive('pad', function () {
        /*
         * El objeto scope permite obtener los atributos "lado" y "posición" del elemento DOM <pad>
         * y provee al template con dichos elementos dentro del $scope del controlador padre
         * 
         * El template define el elemento HTML, que se estiliza por medio de CSS
         */
        return {
            scope: {
                lado: '=',
                posicion: '='
            },
            restrict: 'E',
            template: '<div class="pad" ng-attr-style="left: {{ lado }}px; top: {{ posicion }}px"></div>'
        };
    });



    /*
     *  Directiva ball
     */

    app.directive('ball', function () {
        return {
            scope: {
                posicion: '='
            },
            restrict: 'E',
            template: '<div class="ball" ng-attr-style="top: {{ posicion.y }}px; left: {{ posicion.x }}px;"></div>'
        };
    });



})(window, window.angular);
