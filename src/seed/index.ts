/**
 * Idempotent seed script — safe to run repeatedly (`pnpm seed`).
 * Upserts by slug (content), name (testimonials), and filename (uploads).
 */
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'

import { makePlaceholderJpeg, makePlaceholderPdf } from './placeholders'
import { richText } from './richText'

// Brand colors for placeholder images (no external downloads).
const OLIVE = { r: 74, g: 93, b: 46 }
const TERRACOTTA = { r: 217, g: 119, b: 66 }
const AMBER = { r: 224, g: 164, b: 88 }
const CREAM = { r: 250, g: 246, b: 236 }

const log = (msg: string) => console.log(`[seed] ${msg}`)

/** Find-or-create a media doc, keyed by filename. */
const ensureMedia = async (
  payload: Payload,
  {
    filename,
    alt,
    background,
  }: { filename: string; alt: string; background: { r: number; g: number; b: number } },
): Promise<number> => {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    log(`media exists: ${filename}`)
    return existing.docs[0].id
  }
  const filePath = await makePlaceholderJpeg(filename, background)
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath,
    overrideAccess: true,
  })
  log(`media created: ${filename}`)
  return doc.id
}

/** Find-or-create the private placeholder cookbook PDF. */
const ensureProductPdf = async (payload: Payload): Promise<number> => {
  const filename = 'diabetic-air-fryer-cookbook-placeholder.pdf'
  const existing = await payload.find({
    collection: 'product-files',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    log(`product file exists: ${filename}`)
    return existing.docs[0].id
  }
  const filePath = makePlaceholderPdf(filename, 'The Diabetic Air Fryer Cookbook - placeholder')
  const doc = await payload.create({
    collection: 'product-files',
    data: { title: 'The Diabetic Air Fryer Cookbook (placeholder PDF)' },
    filePath,
    overrideAccess: true,
  })
  log(`product file created: ${filename}`)
  return doc.id
}

const findBySlug = async (
  payload: Payload,
  collection: 'categories' | 'recipes' | 'posts' | 'products',
  slug: string,
) => {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    draft: false,
    overrideAccess: true,
  })
  return res.docs[0]
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  // ---------------------------------------------------------------- categories
  const categoryNames = [
    'Air Fryer',
    'Diabetic-Friendly',
    'Low Carb',
    'High Protein',
    'Breakfast',
    'Dessert',
  ]
  const categoryIds: Record<string, number> = {}
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await findBySlug(payload, 'categories', slug)
    if (existing) {
      categoryIds[name] = existing.id
      log(`category exists: ${name}`)
    } else {
      const doc = await payload.create({
        collection: 'categories',
        data: { name, slug },
        overrideAccess: true,
      })
      categoryIds[name] = doc.id
      log(`category created: ${name}`)
    }
  }

  // ------------------------------------------------------------------- recipes
  const recipes = [
    {
      slug: 'crispy-parmesan-crusted-salmon',
      image: { filename: 'seed-recipe-salmon.jpg', alt: 'Crispy Parmesan-Crusted Salmon fillets in an air fryer basket', background: TERRACOTTA },
      data: {
        title: 'Crispy Parmesan-Crusted Salmon',
        description:
          'Golden, crackly parmesan crust over buttery salmon — 10 minutes in the air fryer, 2g net carbs, and enough protein to keep blood sugar steady all evening.',
        categories: ['Air Fryer', 'Diabetic-Friendly', 'Low Carb', 'High Protein'],
        prepMinutes: 5,
        cookMinutes: 10,
        servings: 2,
        difficulty: 'easy' as const,
        ingredients: [
          { quantity: '2', unit: 'fillets', item: 'salmon (about 170g each)', note: 'skin on, patted dry' },
          { quantity: '30', unit: 'g', item: 'grated parmesan' },
          { quantity: '2', unit: 'tbsp', item: 'almond flour' },
          { quantity: '1', unit: 'tbsp', item: 'olive oil' },
          { quantity: '1', unit: 'tsp', item: 'Dijon mustard' },
          { quantity: '1', unit: 'clove', item: 'garlic', note: 'finely grated' },
          { quantity: '1/2', unit: 'tsp', item: 'smoked paprika' },
          { quantity: '', unit: '', item: 'salt and black pepper', note: 'to taste' },
        ],
        instructions: richText([
          'Preheat the air fryer to 200°C (390°F) for 3 minutes.',
          'Pat the salmon fillets dry and brush the tops with Dijon mustard.',
          'Mix parmesan, almond flour, olive oil, garlic, paprika, salt and pepper into a crumbly paste, then press it evenly onto the mustard-coated tops.',
          'Air fry skin-side down for 8–10 minutes until the crust is deep golden and the salmon flakes easily. Internal temperature should reach 60°C (140°F).',
          'Rest for 2 minutes and serve with lemon wedges and a green salad.',
        ]),
        nutrition: { calories: 420, protein: 38, netCarbs: 2, fat: 28, fiber: 1 },
      },
    },
    {
      slug: 'crunchy-zucchini-chips',
      image: { filename: 'seed-recipe-zucchini.jpg', alt: 'Crunchy air fryer zucchini chips on a cream plate', background: OLIVE },
      data: {
        title: 'Crunchy Zucchini Chips',
        description:
          'The diabetic-friendly answer to potato chips: thin zucchini rounds air-fried until shatteringly crisp with 80% less oil — 5g net carbs per serving.',
        categories: ['Air Fryer', 'Diabetic-Friendly', 'Low Carb'],
        prepMinutes: 10,
        cookMinutes: 12,
        servings: 4,
        difficulty: 'easy' as const,
        ingredients: [
          { quantity: '2', unit: 'medium', item: 'zucchini', note: 'sliced into 3mm rounds' },
          { quantity: '25', unit: 'g', item: 'grated parmesan' },
          { quantity: '1', unit: 'tbsp', item: 'olive oil' },
          { quantity: '1/2', unit: 'tsp', item: 'garlic powder' },
          { quantity: '1/2', unit: 'tsp', item: 'dried oregano' },
          { quantity: '1/4', unit: 'tsp', item: 'salt' },
        ],
        instructions: richText([
          'Slice the zucchini into even 3mm rounds and press between paper towels for 5 minutes to draw out moisture — this is the secret to real crunch.',
          'Toss the rounds with olive oil, then with parmesan, garlic powder, oregano and salt.',
          'Arrange in a single layer in the air fryer basket (work in batches; overlapping means steaming, not crisping).',
          'Air fry at 180°C (360°F) for 10–12 minutes, flipping halfway, until deeply golden.',
          'Cool for 3 minutes on a rack — they crisp up further as they cool. Eat the same day.',
        ]),
        nutrition: { calories: 90, protein: 4, netCarbs: 5, fat: 6, fiber: 2 },
      },
    },
    {
      slug: 'chorizo-frittata-cups',
      image: { filename: 'seed-recipe-frittata.jpg', alt: 'Chorizo frittata cups fresh from the air fryer', background: AMBER },
      data: {
        title: 'Chorizo Frittata Cups',
        description:
          'Grab-and-go breakfast cups loaded with chorizo, peppers and cheese. Make a batch on Sunday — 3g net carbs each and 14g of protein to start the day steady.',
        categories: ['Air Fryer', 'Diabetic-Friendly', 'High Protein', 'Breakfast'],
        prepMinutes: 10,
        cookMinutes: 14,
        servings: 6,
        difficulty: 'medium' as const,
        ingredients: [
          { quantity: '6', unit: 'large', item: 'eggs' },
          { quantity: '80', unit: 'g', item: 'cured chorizo', note: 'finely diced' },
          { quantity: '1/2', unit: '', item: 'red bell pepper', note: 'finely diced' },
          { quantity: '2', unit: '', item: 'spring onions', note: 'sliced' },
          { quantity: '60', unit: 'g', item: 'grated cheddar' },
          { quantity: '2', unit: 'tbsp', item: 'double cream' },
          { quantity: '1/4', unit: 'tsp', item: 'smoked paprika' },
          { quantity: '', unit: '', item: 'salt and black pepper', note: 'to taste' },
        ],
        instructions: richText([
          'Preheat the air fryer to 160°C (320°F). Lightly grease 6 silicone muffin cups.',
          'Whisk the eggs with cream, paprika, salt and pepper.',
          'Divide chorizo, bell pepper, spring onion and half the cheddar between the cups, then pour over the egg mixture leaving 5mm headroom.',
          'Top with the remaining cheddar and air fry for 12–14 minutes until puffed and just set in the centre.',
          'Cool 5 minutes before unmoulding. Keeps 4 days refrigerated — reheat 2 minutes in the air fryer.',
        ]),
        nutrition: { calories: 185, protein: 14, netCarbs: 3, fat: 13, fiber: 0 },
      },
    },
  ]

  for (const recipe of recipes) {
    const existing = await findBySlug(payload, 'recipes', recipe.slug)
    if (existing) {
      log(`recipe exists: ${recipe.data.title}`)
      continue
    }
    const heroImage = await ensureMedia(payload, recipe.image)
    await payload.create({
      collection: 'recipes',
      data: {
        ...recipe.data,
        slug: recipe.slug,
        heroImage,
        categories: recipe.data.categories.map((name) => categoryIds[name]),
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
      overrideAccess: true,
    })
    log(`recipe created: ${recipe.data.title}`)
  }

  // ---------------------------------------------------------------------- post
  const postSlug = 'why-the-air-fryer-is-a-diabetics-best-friend'
  if (await findBySlug(payload, 'posts', postSlug)) {
    log('post exists')
  } else {
    const heroImage = await ensureMedia(payload, {
      filename: 'seed-post-airfryer.jpg',
      alt: 'An air fryer on a kitchen counter beside fresh vegetables',
      background: OLIVE,
    })
    await payload.create({
      collection: 'posts',
      data: {
        title: "Why the Air Fryer Is a Diabetic's Best Friend",
        slug: postSlug,
        heroImage,
        excerpt:
          'Up to 80% less oil, crispy food without the blood sugar rollercoaster, and dinner on the table in 15 minutes. Here is why the air fryer earns permanent counter space in a diabetic kitchen.',
        content: richText([
          'When you are managing type 2 diabetes, every meal is a small negotiation: flavour and satisfaction on one side, blood glucose on the other. The air fryer is one of the very few kitchen tools that quietly wins both sides of that negotiation at once.',
          { kind: 'h2', text: 'Crispy without the carbs (or the oil)' },
          'Deep-fried texture usually comes at a double cost — refined breading and a lot of oil. An air fryer produces the same Maillard browning with up to 80% less oil, which means fewer calories, less saturated fat, and no need for flour-heavy coatings. Parmesan, almond flour and crushed pork rinds crisp up beautifully instead.',
          { kind: 'h2', text: 'Speed is a compliance tool' },
          'The biggest threat to a diabetic-friendly diet is not ignorance — it is a long day. When cooking takes 45 minutes, takeaway wins. Most air fryer meals are done in 15, with almost no cleanup. The easier the healthy option is, the more often you actually choose it.',
          { kind: 'h2', text: 'Protein-first cooking, made easy' },
          'Salmon fillets, chicken thighs, frittata cups: the air fryer excels at exactly the high-protein, low-carb foods that flatten glucose curves. Batch-cook on Sunday, reheat in 3 minutes, and breakfast stops being a blood sugar gamble.',
          'Start with our 15-minute recipes, check the net carbs on every card, and let the machine do the heavy lifting.',
        ]),
        categories: [categoryIds['Air Fryer'], categoryIds['Diabetic-Friendly']],
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
      overrideAccess: true,
    })
    log('post created')
  }

  // -------------------------------------------------------------- testimonials
  const testimonials = [
    {
      name: 'Sandra M.',
      context: 'Lost 8kg with air fryer meals',
      quote:
        'I bought the cookbook thinking it would be another list of sad diet food. Three months later my fasting glucose is down 22 points and my family asks for the parmesan salmon by name.',
    },
    {
      name: 'James T.',
      context: 'Type 2, diagnosed 2024',
      quote:
        'The 15-minute thing is real. I cook after 12-hour shifts now instead of ordering takeaway, and my last HbA1c genuinely surprised my doctor.',
    },
    {
      name: 'Alicia R.',
      context: 'Cooking for a diabetic husband',
      quote:
        'Finally one set of recipes the whole house eats. The net carbs on every recipe take all the guesswork out of dinner — the zucchini chips never survive to the table.',
    },
  ]
  for (const t of testimonials) {
    const existing = await payload.find({
      collection: 'testimonials',
      where: { name: { equals: t.name } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      log(`testimonial exists: ${t.name}`)
      continue
    }
    await payload.create({ collection: 'testimonials', data: t, overrideAccess: true })
    log(`testimonial created: ${t.name}`)
  }

  // ------------------------------------------------------------------- product
  const productSlug = 'diabetic-air-fryer-cookbook'
  if (await findBySlug(payload, 'products', productSlug)) {
    log('product exists')
  } else {
    const pdfId = await ensureProductPdf(payload)
    const coverId = await ensureMedia(payload, {
      filename: 'seed-product-cookbook.jpg',
      alt: 'The Diabetic Air Fryer Cookbook cover',
      background: CREAM,
    })
    await payload.create({
      collection: 'products',
      data: {
        name: 'The Diabetic Air Fryer Cookbook',
        slug: productSlug,
        priceCents: 2700,
        shortPitch:
          '30 mouth-watering, clinically-informed air fryer recipes — low net carbs, high protein, 90% ready in under 25 minutes. Instant PDF download.',
        salesContent: richText([
          { kind: 'h2', text: 'Crispy, delicious food that loves your blood sugar back' },
          '30 mouth-watering, clinically-informed air fryer recipes using up to 80% less oil. Every recipe is built the diabetic-friendly way: low net carbs, high protein, and honest portions that keep glucose curves flat instead of spiking them.',
          { kind: 'h2', text: 'Designed for real life' },
          '90% of recipes are ready in under 25 minutes — because the healthy choice only works when it is also the easy choice. Complete nutrition facts are included for every single recipe, so you always know exactly what is on your plate.',
          { kind: 'h2', text: 'Everything inside' },
          '30 clinically-informed air fryer recipes with complete nutrition facts per recipe. BONUS: a 7-Day Strategic Meal Plan, a Professional Grocery Guide, and Blood Sugar Lifestyle Tips. 37 pages, instant PDF download — start cooking tonight.',
        ]),
        gallery: [{ image: coverId }],
        pdf: pdfId,
        active: true,
        _status: 'published',
      },
      overrideAccess: true,
    })
    log('product created')
  }

  // -------------------------------------------------------------- site settings
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      socialLinks: {
        instagram: 'https://www.instagram.com/drzeebites.official',
        pinterest: 'https://nl.pinterest.com/DrZeeBites/',
        tiktok: 'https://www.tiktok.com/@drzeebites',
      },
      defaultSeo: {
        title: 'DrZeeBites — 15-Minute Diabetic-Friendly Air Fryer Recipes',
        description:
          'Low-carb, high-protein, diabetic-friendly air fryer recipes ready in 15 minutes. Home of The Diabetic Air Fryer Cookbook.',
      },
      announcement: {
        text: 'The Diabetic Air Fryer Cookbook — 30 recipes, $27, instant download.',
        enabled: false,
      },
    },
    overrideAccess: true,
  })
  log('site settings updated')

  log('done')
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed] failed:', err)
  process.exit(1)
})
