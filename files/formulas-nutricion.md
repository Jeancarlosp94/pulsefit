# 🥗 Fórmulas de Nutrición — Validadas por Lucía (Mg. Nutrición Deportiva)

> Referencia técnica para el motor `src/features/nutrition-engine/`. Lee este archivo cuando vayas a implementar o modificar cálculos calóricos, distribución de macros o validaciones nutricionales.

---

## TMB (Tasa Metabólica Basal) — Fórmula Mifflin-St Jeor

```
Hombres: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad + 5
Mujeres: TMB = 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad - 161
```

**Para `prefer_not_to_say`**: usar el promedio de ambas fórmulas.

**Implementación esperada:**
```ts
// src/features/nutrition-engine/calculations.ts
export const calculateTMB = (params: ItfTMBParams): number => {
   const { weightKg, heightCm, age, sex } = params
   const base = 10 * weightKg + 6.25 * heightCm - 5 * age
   if (sex === 'male') return base + 5
   if (sex === 'female') return base - 161
   return base - 78  // promedio para prefer_not_to_say
}
```

---

## GET (Gasto Energético Total)

```
GET = TMB × Factor de actividad

Factores:
  sedentary    → 1.2     (oficina, sin ejercicio)
  light        → 1.375   (1-3 días de ejercicio/sem)
  moderate     → 1.55    (3-5 días/sem)
  active       → 1.725   (6-7 días/sem)
  very_active  → 1.9     (atletas, trabajo físico)
```

---

## Déficit y superávit calórico

```
Para perder peso:    GET × 0.75 a 0.85 (déficit 15-25%)
Para mantener:       GET
Para ganar músculo:  GET × 1.10 a 1.15 (superávit 10-15%)
```

**Pérdida típica esperada:** 0.3-0.7 kg/semana con déficit del 15-25%.

---

## 🚨 Límites de seguridad — NO NEGOCIABLES

Estos límites se aplican como validaciones duras en el motor. Si el cálculo del usuario los viola, **NO** generar el plan; en su lugar, devolver un mensaje compasivo sugiriendo ajustar la meta.

```
MIN_KCAL_FEMALE = 1200       // mujeres: nunca menos
MIN_KCAL_MALE = 1500         // hombres: nunca menos
MAX_DEFICIT_PCT = 25         // máximo 25% por debajo del GET
MAX_WEEKLY_LOSS_PCT = 1.0    // máximo 1% del peso corporal por semana
MIN_AGE = 18                 // < 18 requiere disclaimer + supervisión profesional
```

**Implementación esperada:**
```ts
// src/features/nutrition-engine/safety-checks.ts
export const validateNutritionPlan = (params: ItfPlanInput): ItfValidationResult => {
   const { sex, targetKcal, currentWeightKg, targetWeightKg, weeksToGoal } = params

   const minKcal = sex === 'female' ? 1200 : 1500
   if (targetKcal < minKcal) {
      return {
         ok: false,
         reason: 'kcal_too_low',
         message: 'La meta requiere comer muy poco. Hagamos un plan más sostenible 🌱',
         suggestedAdjustment: { targetKcal: minKcal }
      }
   }

   const weeklyLoss = (currentWeightKg - targetWeightKg) / weeksToGoal
   const weeklyLossPct = (weeklyLoss / currentWeightKg) * 100
   if (weeklyLossPct > 1.0) {
      const suggestedWeeks = Math.ceil((currentWeightKg - targetWeightKg) / (currentWeightKg * 0.01))
      return {
         ok: false,
         reason: 'loss_too_fast',
         message: 'Esa meta es ambiciosa. Te sugiero más tiempo para que sea sostenible 🌿',
         suggestedAdjustment: { weeksToGoal: suggestedWeeks }
      }
   }

   return { ok: true }
}
```

**La validación no bloquea, EDUCA.** El usuario puede aceptar la sugerencia o continuar bajo su responsabilidad (con disclaimer adicional). Excepción: si `targetKcal < minKcal` después de varios ajustes, sí bloquear y exigir consulta médica.

---

## Macronutrientes

### Proteína (PRIORIDAD #1)

```
Persona sedentaria sin entrenamiento:  0.8 g/kg peso corporal
Persona que entrena:                   1.6 g/kg
Persona en déficit calórico:           1.8 - 2.2 g/kg (preserva masa muscular)
```

**Regla operativa del motor:**
- Si `goal === 'lose'`: usar 2.0 g/kg.
- Si `goal === 'gain'`: usar 1.8 g/kg.
- Si `goal === 'maintain'` con entrenamiento: 1.6 g/kg.
- Si `goal === 'feel_better'` sin entrenamiento: 1.2 g/kg.

### Grasas

```
Mínimo:  0.8 g/kg peso corporal
Rango ideal: 20-30% de calorías totales
```

### Carbohidratos

```
Carbohidratos = (Total kcal - Proteína kcal - Grasas kcal) / 4

Donde:
  Proteína: 4 kcal/g
  Carbos:   4 kcal/g
  Grasas:   9 kcal/g
```

**Implementación esperada:**
```ts
// src/features/nutrition-engine/macro-distribution.ts
export const distributeMacros = (params: ItfMacroParams): ItfMacroDistribution => {
   const { totalKcal, weightKg, goal } = params

   const proteinPerKg = goal === 'lose' ? 2.0 : goal === 'gain' ? 1.8 : 1.6
   const proteinG = Math.round(weightKg * proteinPerKg)
   const proteinKcal = proteinG * 4

   const fatsKcal = Math.max(weightKg * 0.8 * 9, totalKcal * 0.25)
   const fatsG = Math.round(fatsKcal / 9)

   const carbsKcal = totalKcal - proteinKcal - fatsKcal
   const carbsG = Math.round(carbsKcal / 4)

   return { proteinG, fatsG, carbsG, totalKcal }
}
```

---

## Hidratación

```
Mínimo: 35 ml × kg de peso corporal
```

Persona de 80 kg → 2800 ml/día mínimo.

---

## 🚩 Banderas rojas — Detección de patrones problemáticos

El motor `review-engine` debe detectar estas señales y derivar a recursos profesionales (NUNCA dar consejos clínicos):

| Señal | Umbral | Acción |
|-------|--------|--------|
| Pérdida de peso muy rápida | > 1% peso corporal/semana sostenida 2+ semanas | Subir calorías 200 kcal + sugerir consulta médica |
| Ingesta muy baja | < 50% del GET por 3+ días | Mensaje compasivo + sugerir consulta nutricional |
| Aumento de ejercicio + reducción de comida | Combo detectado | Mensaje de cuidado + recursos de bienestar |
| Reportes de "atracón" frecuentes | 2+ por semana | NO sugerir compensar. Mensaje normalizador. Sugerir profesional si persiste 3+ semanas |
| Obsesión con balanza | Pesarse 5+ veces/día detectado por logs | Sugerir ocultar peso 1 semana, enfocar otras métricas |

**Lenguaje obligatorio en banderas rojas:**
- ❌ "Estás haciendo algo mal"
- ❌ "Estás en riesgo de un trastorno"
- ✅ "Notamos algo que vale la pena revisar con un profesional. ¿Te ayudamos a buscar uno cerca?"

---

## Manejo de atracones

Si el usuario reporta atracón (campo libre en logs o trigger explícito):

1. **NUNCA** sugerir compensación con ejercicio o restricción al día siguiente.
2. Mensaje: `'Pasa. Mañana retomamos el plan normal, sin castigo 🌿'`
3. Mantener el plan del día siguiente igual.
4. Agregar entrada en `pattern_insights` con tipo `binge_reported`.
5. Si se reporta 3+ semanas seguidas, mostrar pantalla de recursos profesionales.

---

## Personalización cultural y regional

El campo `region` en profiles (default `'LATAM'`) determina:

- **Banco de alimentos prioritario.** Para LATAM priorizar Open Food Facts en español + alimentos locales precargados (plátano, yuca, quinua, frijoles, tortillas de maíz, arepas, ceviche, arroz con frijoles, lentejas, plátano maduro, aguacate, mango, papaya).
- **Plantillas de comidas.** No imponer "oatmeal con berries" a alguien de LATAM. Ofrecer "huevos con plátano frito y café" como alternativa equivalente en macros.
- **Guías de restaurante.** En `restaurant_guides` incluir cocinas locales (peruana, mexicana, argentina, colombiana, ecuatoriana) además de las internacionales.

---

## Conversiones de porciones visuales

Para principiantes, **default a porciones visuales** en lugar de gramos exactos:

```
Proteína:
  Una palma de mano (sin dedos)  ≈ 100-120 g (mujer) / 130-150 g (hombre)
  Un puño                        ≈ 1 huevo grande / ½ taza atún
  Un dedo pulgar                 ≈ 30 g de queso

Carbohidratos:
  Un puño                        ≈ ½ taza de arroz/pasta cocida (~75 g)
  Una palma                      ≈ 1 plátano mediano
  Una bola de tenis              ≈ 1 papa mediana

Grasas:
  Un dedo pulgar                 ≈ 1 cucharada de aceite/mantequilla (~14 g)
  Media palma                    ≈ ¼ aguacate

Verduras:
  Las que entren en dos manos    ≈ porción ilimitada
```

Modo "gramos exactos" disponible como toggle avanzado en perfil.

---

## Frecuencia de recálculo

El motor debe recalcular TMB y GET cuando:

- El usuario actualiza `current_weight_kg` y la diferencia con el último cálculo es ≥ 2 kg.
- Han pasado 4 semanas desde el último recálculo.
- El usuario cambia `activity_level`.
- El usuario completa una revisión semanal con cambio de meta.

Guardar histórico en `pattern_insights` con `pattern_type = 'metabolic_recalc'`.

---

## Integración con generador híbrido

Las fórmulas y validaciones de este documento son la **PRIMERA CAPA** del motor `meal-generator`. Después de calcular el objetivo nutricional (macros target por comida) y filtrar ingredientes válidos según el perfil, se invoca a la IA para componer los platos. La IA NO recalcula nada, solo combina.

Si la IA devuelve un plato cuyas cantidades no coinciden con las prescritas, el validador lo rechaza. Las fórmulas de este archivo son la **fuente única de verdad** de los números — TMB, GET, déficit, macros, mínimos de seguridad, banderas rojas.

Flujo resumido:

```
1. Motor calcula target macros del usuario para esa comida (este archivo).
2. Motor filtra y selecciona ingredientes con cantidades exactas.
3. IA recibe SOLO los ingredientes con cantidades fijas y propone 3 recetas.
4. Validador rechaza cualquier respuesta que altere cantidades o sume ingredientes nuevos.
5. Si IA falla 2 veces → fallback determinístico.
```

Ver `generadores-hibridos.md` para el flujo completo, prompts exactos y reglas del validador.
