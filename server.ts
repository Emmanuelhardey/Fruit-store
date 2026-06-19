import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Product, Order, OrderItem, CustomBlend } from './src/types';

const app = express();
app.use(express.json());

const PORT = 3000;

// ==========================================
// In-Memory Database / Seed Data
// ==========================================

let products: Product[] = [
  {
    id: 'prod-1',
    name: 'Sunset Citrus Glow',
    description: 'A vibrant, refreshing press of pure blood orange, pink grapefruit, clean lemon, and a subtle warm touch of fresh organic ginger.',
    price: 7.99,
    ingredients: ['Blood Orange', 'Pink Grapefruit', 'Lemon', 'Ginger Root'],
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    category: 'Classic',
    inStock: true,
    prepTime: 3,
  },
  {
    id: 'prod-2',
    name: 'Emerald Green Detox',
    description: 'Deeply alkalizing cold-pressed greens. Organic spinach, refreshing cucumber, crisp celery, sour green apple, and fresh peppermint leaves.',
    price: 8.49,
    ingredients: ['Spinach', 'Cucumber', 'Celery', 'Green Apple', 'Peppermint'],
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587caaec?auto=format&fit=crop&w=600&q=80',
    category: 'Signature',
    inStock: true,
    prepTime: 4,
  },
  {
    id: 'prod-3',
    name: 'Ruby Berry Delight',
    description: 'Antioxidant-rich organic strawberries, wild mountain raspberries, and cold-pressed pomegranate seeds elevated with chia seeds.',
    price: 8.99,
    ingredients: ['Strawberry', 'Raspberry', 'Pomegranate', 'Hydrated Chia Seeds'],
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    category: 'Signature',
    inStock: true,
    prepTime: 3,
  },
  {
    id: 'prod-4',
    name: 'Tropical Breeze Wave',
    description: 'Escape to the tropics with organic honey mango cheeks, gold pineapples, tart passionfruit, and a hydrating splash of coconut water.',
    price: 8.29,
    ingredients: ['Mango', 'Pineapple', 'Passionfruit', 'Coconut Water'],
    image: 'https://images.unsplash.com/photo-1628113310823-91371ecbb1a2?auto=format&fit=crop&w=600&q=80',
    category: 'Seasonal',
    inStock: true,
    prepTime: 4,
  },
  {
    id: 'prod-5',
    name: 'Dragon Pearl Fusion',
    description: 'Spectacular bright magenta blend of organic pink dragon fruit, sweet premium lychee, and juicy Bartlett pear slices.',
    price: 9.49,
    ingredients: ['Pink Dragon Fruit', 'Lychee', 'Bartlett Pear'],
    image: 'https://images.unsplash.com/photo-1553530666-ba05429f9c06?auto=format&fit=crop&w=600&q=80',
    category: 'Seasonal',
    inStock: true,
    prepTime: 5,
  }
];

let orders: Order[] = [
  {
    id: 'ord-101',
    userId: 'cust-demo',
    userName: 'Jane Doe',
    userEmail: 'customer@juicecraft.com',
    items: [
      {
        id: 'item-1',
        name: 'Sunset Citrus Glow',
        price: 7.99,
        quantity: 2,
        isCustom: false,
      },
      {
        id: 'item-2',
        name: 'Custom Blend: Royal Citrus Zest',
        price: 9.50,
        quantity: 1,
        isCustom: true,
        customDetails: {
          name: 'Royal Citrus Zest',
          base: 'Coconut Water',
          ingredients: [
            { name: 'Orange', amount: 50, color: '#f97316' },
            { name: 'Lemon', amount: 30, color: '#eab308' },
            { name: 'Ginger', amount: 20, color: '#ca8a04' }
          ],
          sweetness: 'Subtle',
          addins: ['Ginger', 'Mint'],
          aiDescription: 'A custom, bright sparkling juice crafted from fresh cold-pressed oranges and clean lemons in a base of natural coconut water. The hint of ginger and fresh mint adds an invigorating kick.',
          aiTagline: 'Recharge your daily routine with pure royal glow.',
          aiFunFact: 'Lemons contain more sugar than strawberries, but their high acidity masks the sweet taste!',
          aiColor: '#f97316'
        }
      }
    ],
    total: 25.48,
    status: 'on_the_way',
    paymentStatus: 'paid',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    address: '456 Organic Boulevard, Suite 10, Green City',
    tracking: {
      driverName: 'Robert "Juice" Runner',
      driverPhone: '+1 (555) 321-7890',
      driverStep: 2, // Out for delivery
      statusLog: [
        { status: 'Order Received & Verified', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { status: 'Artisanal Cold-Press Commenced', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
        { status: 'Bottled & Packed safely in Ice-bag', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
        { status: 'Driver dispatched with insulated holder', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
      ],
      simulatedProgress: 65,
    }
  }
];

// ==========================================
// Authentication Middleware & Simulated DB
// ==========================================

const users = [
  { id: 'cust-demo', name: 'Jane Doe', email: 'customer@juicecraft.com', password: 'password', role: 'customer' as const },
  { id: 'staff-demo', name: 'Artisan Liam', email: 'staff@juicecraft.com', password: 'password', role: 'staff' as const }
];

// Simple delivery simulation background task
setInterval(() => {
  orders.forEach(order => {
    if (order.status === 'on_the_way' && order.tracking.simulatedProgress < 100) {
      order.tracking.simulatedProgress = Math.min(100, order.tracking.simulatedProgress + Math.floor(Math.random() * 8) + 3);
      if (order.tracking.simulatedProgress >= 100) {
        order.status = 'delivered';
        order.tracking.driverStep = 3;
        order.tracking.statusLog.push({
          status: 'Fresh Cold-pressed Juices Cleanly Delivered!',
          timestamp: new Date().toISOString()
        });
      }
    }
  });
}, 10000); // progressive ticker

// ==========================================
// API Handlers
// ==========================================

// Authentication System
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Please enter both email and password.' });
    return;
  }
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (found) {
    res.json({
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role
    });
  } else {
    res.status(401).json({ error: 'Invalid email or password.' });
  }
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Please fill out all required field inputs.' });
    return;
  }
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }
  const newUser = {
    id: `cust-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password,
    role: 'customer' as const
  };
  users.push(newUser);
  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  });
});

// Products catalog API
app.get('/api/products', (req: Request, res: Response) => {
  res.json({ products });
});

app.post('/api/products', (req: Request, res: Response) => {
  const { name, description, price, ingredients, image, category, inStock, prepTime } = req.body;
  if (!name || !description || price === undefined || !ingredients || !category) {
    res.status(400).json({ error: 'Missing core product details.' });
    return;
  }
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    description,
    price: Number(price),
    ingredients: Array.isArray(ingredients) ? ingredients : (ingredients as string).split(',').map(i => i.trim()),
    image: image || 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    category,
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    prepTime: Number(prepTime) || 4,
  };
  products.unshift(newProduct);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  products[idx] = {
    ...products[idx],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : products[idx].price,
    prepTime: req.body.prepTime !== undefined ? Number(req.body.prepTime) : products[idx].prepTime,
  };
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  const deleted = products.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

// Orders API
app.get('/api/orders', (req: Request, res: Response) => {
  const { userId, role } = req.query;
  if (role === 'staff') {
    res.json({ orders });
  } else if (userId) {
    const userOrders = orders.filter(o => o.userId === userId);
    res.json({ orders: userOrders });
  } else {
    res.json({ orders: [] });
  }
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { userId, userName, userEmail, items, total, address } = req.body;
  if (!userId || !items || !address || total === undefined) {
    res.status(400).json({ error: 'Order is missing fields.' });
    return;
  }

  const newOrder: Order = {
    id: `ord-${Math.floor(100 + Math.random() * 900)}`,
    userId,
    userName,
    userEmail,
    items: items.map((item: any) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${Math.random()}`
    })),
    total: Number(total),
    status: 'pending',
    paymentStatus: 'pending',
    address,
    createdAt: new Date().toISOString(),
    tracking: {
      driverName: 'Sam "Vortex" Spinner',
      driverPhone: '+1 (555) 765-4321',
      driverStep: 0,
      statusLog: [
        { status: 'Order Submitted Safely', timestamp: new Date().toISOString() }
      ],
      simulatedProgress: 0,
    }
  };
  orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

// Update Order Status / Process Tracking Steps
app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  if (status) {
    order.status = status;
    let step = 0;
    let description = '';
    if (status === 'preparing') {
      step = 1;
      description = 'Artisanal Cold-Press Commenced by Liam';
    } else if (status === 'on_the_way') {
      step = 2;
      description = 'Dispatched in cold-insulated carrier capsule';
      order.tracking.simulatedProgress = 10;
    } else if (status === 'delivered') {
      step = 3;
      description = 'Cleanly delivered to target address!';
      order.tracking.simulatedProgress = 100;
    }
    order.tracking.driverStep = step;
    order.tracking.statusLog.push({
      status: description || `Status updated to: ${status}`,
      timestamp: new Date().toISOString()
    });
  }
  res.json(order);
});

// Secure Payment Processing Gateway (API Post)
app.post('/api/orders/:id/pay', (req: Request, res: Response) => {
  const { cardNumber, cardName, expiry, cvc } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order target not found.' });
    return;
  }
  // Secure gateway rule validation simulation
  if (!cardNumber || !cardName || !expiry || !cvc) {
    res.status(400).json({ error: 'Payment failed. Missing required credit card input fields.' });
    return;
  }
  if (cardNumber.replace(/\s+/g, '').length < 16 || cvc.length < 3) {
    res.status(400).json({ error: 'Payment declined. Invalid card digits details.' });
    return;
  }

  order.paymentStatus = 'paid';
  if (order.status === 'pending') {
    order.status = 'preparing';
    order.tracking.driverStep = 1;
    order.tracking.statusLog.push({
      status: 'Payment secured successfully! Cold-press preparation has started.',
      timestamp: new Date().toISOString()
    });
  }
  res.json({ success: true, message: 'Payment of $' + order.total.toFixed(2) + ' secured through JuicePay Gateway.', order });
});

// AI Flavor Blend Generator (Gemini-3.5-flash)
app.post('/api/blend/generate', async (req: Request, res: Response) => {
  const { base, ingredients, sweetness, addins } = req.body;
  if (!base || !ingredients || !ingredients.length) {
    res.status(400).json({ error: 'Please choose fruit ingredients and an organic base.' });
    return;
  }

  const ingredientsList = ingredients.map((i: any) => `${i.name} (${i.amount}%)`).join(', ');
  const addinsList = addins && addins.length ? addins.join(', ') : 'None';

  // Lazy initialize GoogleGenAI safely as instructed
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Elegant realistic fallback with smart color computation based on fruit colors
    const colors = ingredients.map((i: any) => i.color || '#fff');
    // Simple hex average
    let r = 0, g = 0, b = 0;
    colors.forEach((c: string) => {
      const parsed = parseInt(c.slice(1), 16);
      r += (parsed >> 16) & 255;
      g += (parsed >> 8) & 255;
      b += parsed & 255;
    });
    r = Math.floor(r / colors.length);
    g = Math.floor(g / colors.length);
    b = Math.floor(b / colors.length);
    const blendColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

    const mockNames = [
      'Zenith Meadow Splash', 'Crimson Velvet Squeeze', 'Hyperion Gold Press',
      'Amber Orchard Elixir', 'Verdant Forest Elixir', 'Cosmic Aura Glow'
    ];
    const generatedName = mockNames[Math.floor(Math.random() * mockNames.length)];

    res.json({
      name: generatedName,
      aiColor: blendColor,
      aiDescription: `A handcrafted cold-pressed hydration elixir. Composed of a wholesome base of ${base}, featuring delicious bursts of ${ingredientsList}, with a ${sweetness.toLowerCase()} sweetness level and highlighted by ${addinsList}.`,
      aiTagline: 'Made fresh, by you, for your unique wellness footprint.',
      aiFunFact: 'Blended organic juices retain maximum bio-absorbable micronutrients when pressed immediately with a specialized hydraulic force.',
      keyMissingPrompt: true, // Signal to let frontend know it is a graceful fallback with tips to setup key
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `
      Create an organic artisanal juice brand profile for a customized cold-pressed juice.
      Inputs:
      - Raw Base: ${base}
      - Core Ingredients with percentage blends: ${ingredientsList}
      - Pure Sweetness Profile: ${sweetness}
      - Active Add-ins: ${addinsList}

      Return a highly structured JSON object matching this schema EXACTLY:
      {
        "name": "Creative organic artisanal name for this custom juice recipe (max 4 words)",
        "aiDescription": "Gourmet sensory description of the tasting notes, texture, and aroma (2-3 sentences)",
        "aiTagline": "A luxurious organic marketing tagline/slogan (under 10 words)",
        "aiFunFact": "An interesting wellness, scientific, or bio-nutrient fun fact about one of the ingredients (under 20 words)",
        "aiColor": "The exact single color hex string (e.g. '#e11d48' or '#84cc16') that represent the combined physical juice color when blended"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['name', 'aiDescription', 'aiTagline', 'aiFunFact', 'aiColor'],
          properties: {
            name: { type: Type.STRING },
            aiDescription: { type: Type.STRING },
            aiTagline: { type: Type.STRING },
            aiFunFact: { type: Type.STRING },
            aiColor: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    res.json(parsed);

  } catch (error: any) {
    console.error('Gemini API Error: ', error);
    res.status(500).json({ error: 'AI Blend Analyzer failed. Please confirm your API Key details are valid.', details: error.message });
  }
});

// ==========================================
// Vite Middleware Setup / Static Assets
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully at http://localhost:${PORT}`);
  });
}

startServer();
