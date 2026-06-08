import styles from '../styles/MedidaChips.module.css'

const GRUPOS_COMPRA = [
  {
    label: 'Para sólidos (harina, azúcar, mantequilla...)',
    chips: [
      { val: 'g',  label: 'Gramos' },
      { val: 'kg', label: 'Kilogramos' },
      { val: 'oz', label: 'Onzas' },
      { val: 'lb', label: 'Libras' },
    ],
  },
  {
    label: 'Para líquidos (leche, aceite, esencia...)',
    chips: [
      { val: 'ml', label: 'Mililitros' },
      { val: 'l', label: 'Litros' },
      { val: 'tsp', label: 'Cucharadita' },
      { val: 'tbsp', label: 'Cucharada' },
      { val: 'cup', label: 'Taza' },
      { val: 'fl_oz', label: 'Onza fl.' },
    ],
  },
  {
    label: 'Para piezas (huevos, limones...)',
    chips: [
      { val: 'pz', label: 'Piezas' },
    ],
  },
]

const GRUPOS_RECETA = [
  {
    label: 'Medidas de sólidos',
    chips: [
      { val: 'g', label: 'Gramos' },
      { val: 'kg', label: 'Kilogramos' },
      { val: 'oz', label: 'Onzas' },
      { val: 'lb', label: 'Libras' },
    ],
  },
  {
    label: 'Medidas de líquidos',
    chips: [
      { val: 'ml', label: 'Mililitros' },
      { val: 'l', label: 'Litros' },
      { val: 'tsp', label: 'Cucharadita' },
      { val: 'tbsp', label: 'Cucharada' },
      { val: 'cup', label: 'Taza' },
      { val: 'fl_oz', label: 'Onza fl.' },
    ],
  },
  {
    label: 'Medidas culinarias',
    chips: [
      { val: 'pizca', label: 'Pizca' },
    ],
  },
  {
    label: 'Medidas por pieza',
    chips: [
      { val: 'pz', label: 'Piezas' },
    ],
  },
]

export default function MedidaChips({ value, onChange, variant = 'compra', allowedUnits = null }) {
  const grupos = variant === 'receta' ? GRUPOS_RECETA : GRUPOS_COMPRA

  return (
    <div className={styles.wrap}>
      {grupos.map(grupo => {
        const chips = allowedUnits
          ? grupo.chips.filter(chip => allowedUnits.includes(chip.val))
          : grupo.chips

        if (!chips.length) return null

        return (
          <div key={grupo.label} className={styles.grupo}>
            <div className={styles.grupoLabel}>{grupo.label}</div>
            <div className={styles.chips}>
              {chips.map(chip => (
                <button
                  key={chip.val}
                  type="button"
                  className={`${styles.chip} ${value === chip.val ? styles.active : ''}`}
                  onClick={() => onChange(chip.val)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
