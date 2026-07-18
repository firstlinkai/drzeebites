'use client'

import { useState } from 'react'

type Ingredient = {
  quantity?: string | null
  unit?: string | null
  item: string
  note?: string | null
  id?: string | null
}

/**
 * Cook-along ingredient checklist. Checked items are struck through so you
 * can track what's already in the bowl. State is local-only on purpose.
 */
export function IngredientsChecklist({ ingredients }: { ingredients: Ingredient[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggle = (index: number) =>
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }))

  return (
    <ul className="space-y-1">
      {ingredients.map((ing, index) => {
        const isChecked = Boolean(checked[index])
        const amount = [ing.quantity, ing.unit].filter(Boolean).join(' ')
        return (
          <li key={ing.id ?? index}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-primary-soft/60 ${
                isChecked ? 'opacity-55' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(index)}
                className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[#4A5D2E]"
              />
              <span className={`text-[0.95rem] leading-snug ${isChecked ? 'line-through' : ''}`}>
                {amount ? <strong className="font-semibold text-ink">{amount} </strong> : null}
                <span className="text-ink/85">{ing.item}</span>
                {ing.note ? <span className="text-ink/55"> — {ing.note}</span> : null}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
