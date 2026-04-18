import { z } from 'zod';

const uuid = z.string().uuid();

const offerBaseSchema = z.object({
  product_id: uuid,
  original_price: z.number().positive(),
  offer_price: z.number().positive(),
  discount_pct: z.union([z.number().min(0).max(100), z.string()]),
  offer_url: z.string().url().max(2000),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  is_active: z.boolean().optional(),
  scraped_at: z.string().datetime().optional(),
});

function validateOfferPriceOrder(value: { original_price?: number; offer_price?: number }, ctx: z.RefinementCtx) {
  if (typeof value.original_price === 'number' && typeof value.offer_price === 'number' && value.original_price < value.offer_price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'original_price must be greater than or equal to offer_price',
      path: ['original_price'],
    });
  }
}

export const createOfferSchema = offerBaseSchema.superRefine(validateOfferPriceOrder);

export const updateOfferSchema = offerBaseSchema
  .partial()
  .superRefine((value, ctx) => {
    validateOfferPriceOrder(value, ctx);
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required for update',
        path: [],
      });
    }
  });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  parent_id: uuid.nullable().optional(),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
  });
