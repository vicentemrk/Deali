import { z } from 'zod';

const uuid = z.string().uuid();

export const createOfferSchema = z.object({
  product_id: uuid,
  original_price: z.number().positive(),
  offer_price: z.number().positive(),
  discount_pct: z.union([z.number().min(0).max(100), z.string()]),
  offer_url: z.string().url().max(2000),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  is_active: z.boolean().optional(),
  scraped_at: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  if (value.original_price < value.offer_price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'original_price must be greater than or equal to offer_price',
      path: ['original_price'],
    });
  }
});

export const updateOfferSchema = createOfferSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
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
