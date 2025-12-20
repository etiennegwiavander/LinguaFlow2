/**
 * AI Image Generation utilities (server-safe, no React hooks)
 */

/**
 * Pre-generated educational images for common lesson types
 */
const PRE_GENERATED_IMAGES = {
  conversation: [
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1792&h=1024&fit=crop&crop=center",
  ],
  grammar: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center",
  ],
  vocabulary: [
    "https://images.unsplash.com/photo-1589998059171-988d887df646?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center",
  ],
  pronunciation: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1792&h=1024&fit=crop&crop=center",
  ],
  reading: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?w=1792&h=1024&fit=crop&crop=center",
  ],
  writing: [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1792&h=1024&fit=crop&crop=center",
  ],
  listening: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1792&h=1024&fit=crop&crop=center",
  ],
  culture: [
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center",
  ],
  business: [
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1486312338219-ce68e2c6b696?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1792&h=1024&fit=crop&crop=center",
  ],
  travel: [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=1792&h=1024&fit=crop&crop=center",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1792&h=1024&fit=crop&crop=center",
  ],
};

/**
 * Get instant image based on lesson content analysis (server-safe)
 */
export function getInstantImage(title: string): string | null {
  const lowerTitle = title.toLowerCase();

  // Check for keywords in title
  for (const [category, imageArray] of Object.entries(PRE_GENERATED_IMAGES)) {
    if (lowerTitle.includes(category)) {
      const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
      const imageIndex = hash % imageArray.length;
      return imageArray[imageIndex];
    }
  }

  // Check for common language learning patterns
  if (
    lowerTitle.includes("speak") ||
    lowerTitle.includes("talk") ||
    lowerTitle.includes("conversation")
  ) {
    const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.conversation.length;
    return PRE_GENERATED_IMAGES.conversation[imageIndex];
  }
  if (lowerTitle.includes("word") || lowerTitle.includes("vocabulary")) {
    const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.vocabulary.length;
    return PRE_GENERATED_IMAGES.vocabulary[imageIndex];
  }
  if (lowerTitle.includes("read") || lowerTitle.includes("text")) {
    const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const imageIndex = hash % PRE_GENERATED_IMAGES.reading.length;
    return PRE_GENERATED_IMAGES.reading[imageIndex];
  }

  return null;
}

/**
 * Enhanced fallback using pre-generated educational images (server-safe)
 */
export function generateEnhancedFallback(title: string): string {
  const contextualImage = getInstantImage(title);
  if (contextualImage) {
    return contextualImage;
  }

  const allCategories = Object.keys(PRE_GENERATED_IMAGES);
  const hash = title.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const categoryIndex = hash % allCategories.length;
  const selectedCategory = allCategories[categoryIndex];
  const imageArray =
    PRE_GENERATED_IMAGES[selectedCategory as keyof typeof PRE_GENERATED_IMAGES];
  const imageIndex = (hash * 7) % imageArray.length;

  return imageArray[imageIndex];
}
