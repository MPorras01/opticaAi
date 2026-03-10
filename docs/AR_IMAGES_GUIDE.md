# Guia De Imagenes AR Para OpticaAI

## Requisitos Tecnicos Del PNG

- Resolucion minima: `800x400 px` (ratio `2:1`).
- Resolucion recomendada: `1200x600 px`.
- Fondo: `100% transparente` (canal alpha).
- Las gafas deben ocupar aproximadamente el `90%` del ancho del PNG.
- El puente de la montura debe quedar en el centro horizontal exacto del PNG.
- Las patillas no deben aparecer en el PNG, solo la parte frontal.
- Formato: `PNG-24` con transparencia.

## Proceso Con Canva (Gratis)

1. Toma una foto de la montura de frente sobre fondo blanco puro.
2. Sube la imagen a `canva.com`.
3. Entra a Editar foto y usa Eliminar fondo.
4. Recorta para que las gafas ocupen cerca del 90% del canvas.
5. Verifica que el puente este centrado.
6. Exporta como PNG con Fondo transparente activado.

## Proceso Con Remove.bg (Gratis Con Limites)

1. Sube la foto a `remove.bg`.
2. Descarga el PNG resultante.
3. Ajusta en Canva si necesitas recorte o centrado fino.

## Errores Comunes

- Fondo blanco residual: usa la herramienta borrador en Canva.
- Gafas no centradas: recorta manualmente para centrar el puente.
- PNG muy pequeno: escala a minimo `800x400` antes de exportar.
- Patillas incluidas: recorta para excluirlas y dejar solo frente de la montura.

## Como Subir A Supabase Storage

1. En Supabase Dashboard abre Storage.
2. Crea bucket publico llamado `ar-overlays`.
3. Sube el PNG.
4. Copia la URL publica del archivo.
5. En admin, edita el producto y pega la URL en `ar_overlay_url`.
6. Activa el toggle `has_ar_overlay`.

## Script De Validacion

El script `src/scripts/validate-ar-image.ts` valida:

- Que la URL responda correctamente.
- Que la imagen sea PNG.
- Que tenga canal alpha/transparencia.
- Que cumpla dimensiones minimas.

### Uso

```bash
npx tsx src/scripts/validate-ar-image.ts "https://tu-url-publica.png"
```
