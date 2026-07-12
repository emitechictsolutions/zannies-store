export type CategorySlug =
  | "jewellery"
  | "hair"
  | "beauty"
  | "clothing"
  | "men-clothing"
  | "women-clothing"
  | "kids-clothing";

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  image: string;
  subcategories: string[];
  parent?: CategorySlug;
  hiddenFromNav?: boolean;
}

export const categories: Category[] = [
  {
    slug: "jewellery",
    name: "Jewellery",
    tagline: "Heirloom 18K – 24K Gold",
    description: "Authenticated gold pieces — chains, rings, bangles, and signature collections handcrafted for those who wear their legacy.",
    image: "/assets/cat-jewellery.jpg",
    subcategories: ["18K Gold", "21K Gold", "22K Gold", "24K Gold", "Rings", "Chains", "Bracelets", "Earrings", "Necklaces"],
  },
  {
    slug: "hair",
    name: "Hair",
    tagline: "Premium Bundles & Closures",
    description: "Ethically sourced raw hair — bone straight, body wave, deep wave, pixie and frontals with the kind of luster that lasts.",
    image: "/assets/cat-hair.jpg",
    subcategories: ["Bone Straight", "Body Wave", "Deep Wave", "Pixie Curl", "Jerry Curl", "Closure", "Frontal", "Bundles"],
  },
  {
    slug: "beauty",
    name: "Beauty",
    tagline: "Skin · Scent · Glow",
    description: "Curated skincare, cosmetics and fragrance from the houses we trust — for the ritual you deserve every morning.",
    image: "/assets/cat-beauty.jpg",
    subcategories: ["Skincare", "Cosmetics", "Makeup", "Perfume", "Body Care"],
  },
  {
    slug: "clothing",
    name: "Clothing",
    tagline: "Tailored Elegance",
    description: "Womenswear, menswear, kids and accessories — pieces designed to be photographed and remembered.",
    image: "/assets/cat-clothing.jpg",
    subcategories: ["Women", "Men", "Children", "Shoes", "Accessories"],
  },
  {
    slug: "men-clothing",
    name: "Men's Clothing",
    tagline: "Sharp · Tailored · Timeless",
    description: "Bespoke suiting, refined casualwear, statement outerwear and heritage accessories for the modern gentleman.",
    image: "/assets/hero-men.jpg",
    parent: "clothing",
    subcategories: ["Suits", "Shirts", "Trousers", "Outerwear", "Traditional", "Shoes", "Accessories"],
  },
  {
    slug: "women-clothing",
    name: "Women's Clothing",
    tagline: "Poised · Feminine · Iconic",
    description: "Evening gowns, silk sets, tailored dresses and heirloom pieces — a wardrobe crafted for the woman who leaves a legacy.",
    image: "/assets/hero-women.jpg",
    parent: "clothing",
    subcategories: ["Dresses", "Gowns", "Two-Piece Sets", "Traditional", "Outerwear", "Shoes", "Bags"],
  },
  {
    slug: "kids-clothing",
    name: "Kids' Clothing",
    tagline: "Little Icons · Big Moments",
    description: "Occasion wear, everyday luxe and adorable accessories for the smallest members of the family — made to be treasured.",
    image: "/assets/hero-kids.jpg",
    parent: "clothing",
    subcategories: ["Boys", "Girls", "Occasion Wear", "Everyday", "Shoes", "Accessories"],
  },
];

export const categoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);
