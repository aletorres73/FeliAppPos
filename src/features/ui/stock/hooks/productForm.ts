import type { Product } from '../../../domain/types/productTypes';

export const createEmptyProduct = (): Partial<Product> => ({
    id: '',
    article: '',
    branch: '',
    active: true,
    saleWeight: false,
    stock: 0,
    weight: 0,
    cost: 0,
    gains: 0,
    price: 0,
    isParent: false,
    parentId: null,
    stockLinked: false,
    conversionFactor: null,
    volumePrices: [],
    unitsPerBulk: null,
    bulkCost: null,
    expirationDate: null,
});

export const updateProductCost = (product: Partial<Product>, cost: number): Partial<Product> => ({
    ...product,
    cost,
    price: Number((cost * (1 + (product.gains || 0) / 100)).toFixed(2)),
});

export const updateProductGains = (product: Partial<Product>, gains: number): Partial<Product> => ({
    ...product,
    gains,
    price: Number(((product.cost || 0) * (1 + gains / 100)).toFixed(2)),
});

export const updateProductPrice = (product: Partial<Product>, price: number): Partial<Product> => ({
    ...product,
    price,
    gains: product.cost && product.cost > 0
        ? Number((((price - product.cost) / product.cost) * 100).toFixed(2))
        : 0,
});

export const toNewProduct = (product: Partial<Product>): Product => ({
    id: product.id?.trim() || '',
    article: product.article?.trim() || '',
    branch: product.branch || '',
    price: product.price || 0,
    stock: product.stock || 0,
    cost: product.cost || 0,
    weight: product.weight || 0,
    saleWeight: product.saleWeight || false,
    active: product.active ?? true,
    gains: product.gains || 0,
    quantitySold: 0,
    weightSold: 0,
    createdAt: Date.now(),
    updatedAt: null,
    isParent: product.isParent || false,
    parentId: product.parentId || null,
    stockLinked: product.stockLinked || false,
    conversionFactor: product.conversionFactor || null,
    volumePrices: product.volumePrices || [],
    expirationDate: product.expirationDate || null,
    unitsPerBulk: product.unitsPerBulk || null,
    bulkCost: product.bulkCost || null,
});
