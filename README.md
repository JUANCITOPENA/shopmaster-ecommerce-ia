# 🛒 ShopMaster - Tienda Web E-Commerce con Inteligencia Artificial

Plataforma moderna, responsiva y funcional de comercio digital creada a partir de asistencia con Inteligencia Artificial. Consume la API pública en tiempo real de **FakeStore**, incluye un sistema de carrito reactivo persistente en `LocalStorage`, pasarela de pago simulada y generación automática de recibos en PDF en formato térmico estrecho de 80 mm con `jsPDF`.

---

## 🚀 Características Principales

- **⚡ Consumo de API en Vivo:** Obtiene productos, descripciones, precios, ratings e imágenes desde `https://fakestoreapi.com/products`.
- **🎨 Diseño UI/UX Moderno & Psicología del Color:**
  - Azul Eléctrico (`#007BFF`): Confianza y dinamismo.
  - Verde Compra (`#28A745`): Éxito, confirmación y conversión.
  - Blanco (`#FFFFFF`): Limpieza, espacio y claridad visual.
  - Gris Oscuro (`#343A40`): Máximo contraste y legibilidad.
- **🔍 Modal "Ver Más":** Detalle ampliado de cada producto con imagen de alta definición, calificación con estrellas y selector de unidades.
- **🛒 Carrito de Compras Persistente:** Modificación de cantidades, cálculo dinámico de impuestos (ITBIS 18%), eliminación de productos y persistencia con `LocalStorage`.
- **💳 Pasarela de Pago Simulada:** Formulario con máscaras en tiempo real para tarjeta de crédito, fecha MM/AA, CVV y detección de franquicia (Visa/Mastercard/Amex).
- **🧾 Ticket Térmico en PDF (80 mm):** Generación automática de ticket con `jsPDF` en tipografía monoespaciada tipo recibo de supermercado o tienda física, listo para imprimir.

---

## 🛠️ Tecnologías Empleadas

1. **HTML5:** Estructura semántica moderna.
2. **CSS3:** Variables, flexbox, grid, animaciones y diseño responsivo adaptado de 320px a monitores anchos.
3. **JavaScript (ES6+):** Programación asíncrona (`async/await`, `fetch`), manipulación del DOM y persistencia en cliente.
4. **Bootstrap 5.3.3:** Maquetación fluida y componentes accesibles (Modales, Offcanvas, Spinners, Badges).
5. **Font Awesome 6.5.2:** Iconografía vectorial interactiva.
6. **jsPDF 2.5.1:** Motor de renderizado vectorial de documentos PDF paramétricos.

---

## 📂 Estructura de Archivos

```
E-Commerce_ShopMaster_IA/
│
├── index.html                   # Interfaz de usuario completa y semántica
├── styles.css                   # Hoja de estilos con variables y psicología de color
├── app.js                       # Lógica de negocio, Fetch API, LocalStorage y jsPDF
├── README.md                    # Descripción rápida del proyecto
└── MANUAL_ESTUDIANTE_Y_TUTORIAL.md # Manual académico paso a paso, tutorial y métricas
```

---

## 🖥️ ¿Cómo ejecutarlo en tu computadora?

1. Haz doble clic sobre el archivo `index.html` para abrirlo directamente en tu navegador (Google Chrome, Microsoft Edge, Firefox, Brave).
2. O ábrelo con la extensión **Live Server** en Visual Studio Code para disfrutar de recarga automática en tiempo real.

---
*Desarrollado para fines educativos, investigación y emprendimiento digital.*
