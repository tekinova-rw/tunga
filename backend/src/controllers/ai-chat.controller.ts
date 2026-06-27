// ============================================================
// FILE: backend/src/controllers/ai-chat.controller.ts
// DESCRIPTION: AI Chat controller for AI-powered conversations
// ============================================================

import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vetconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * =========================
 * AI RESPONSE ENGINE
 * =========================
 * Simple rule-based responses - Replace with actual AI API
 */
const getAIResponse = (question: string): string => {
  const q = question.toLowerCase().trim();
  
  // ==================== CATTLE / COW ====================
  if (q.includes('cow') || q.includes('cattle') || q.includes('bull') || q.includes('calf')) {
    if (q.includes('sick') || q.includes('disease') || q.includes('ill') || q.includes('problem')) {
      return '🐄 **Sick Cattle Treatment:**\n\n1. Isolate immediately from other animals\n2. Check temperature (normal: 101.5°F / 38.6°C)\n3. Look for signs: dehydration, loss of appetite, abnormal behavior\n4. **Common diseases:**\n   • Mastitis (udder infection)\n   • Foot-and-Mouth Disease\n   • Bovine Respiratory Disease\n   • East Coast Fever (ECF)\n5. **Action:** Contact a veterinarian immediately for proper diagnosis and treatment\n6. Provide clean water and supportive care';
    }
    if (q.includes('feed') || q.includes('nutrition') || q.includes('diet') || q.includes('food')) {
      return '🐄 **Cattle Nutrition Guide:**\n\n**Daily Requirements:**\n• 2-3% of body weight in dry matter\n• Roughage: hay, silage, pasture grass\n• Grains: maize, sorghum, wheat bran\n• Mineral supplements: salt, calcium, phosphorus\n• Clean, fresh water at all times\n\n**Special Needs:**\n• Dairy cows: higher energy feed during lactation\n• Calves: colostrum within 24 hours of birth\n• Pregnant cows: extra minerals in last trimester';
    }
    if (q.includes('preg') || q.includes('pregnancy') || q.includes('calving') || q.includes('birth')) {
      return '🐄 **Pregnancy & Calving Guide:**\n\n**Gestation:** ~280 days (9 months)\n\n**Signs of Pregnancy:**\n• No heat cycles\n• Weight gain\n• Udder development\n• Growing abdomen\n\n**Calving Preparation:**\n• Prepare clean calving area 2-3 weeks before\n• Watch for signs: udder swelling, relaxation of pelvic ligaments\n• Have vet contact ready\n\n**After Calving:**\n• Ensure calf suckles within 2 hours\n• Provide warm bedding\n• Monitor for retained placenta';
    }
    if (q.includes('milk') || q.includes('dairy') || q.includes('lactat')) {
      return '🥛 **Dairy Cattle Management:**\n\n**Milk Production:**\n• Peaks at 6-8 weeks after calving\n• Average: 6-10 gallons (22-38 liters) per day\n\n**Key Factors:**\n• Proper nutrition (energy, protein, minerals)\n• Genetics and breeding\n• Regular health check-ups\n• Clean milking routine\n\n**Udder Health:**\n• Practice good hygiene during milking\n• Use proper milking technique\n• Monitor for mastitis signs (swelling, heat, abnormal milk)\n• Dry cow therapy at end of lactation';
    }
    if (q.includes('ecf') || q.includes('east coast') || q.includes('tick')) {
      return '🐄 **East Coast Fever (ECF) Information:**\n\n**Cause:** Transmitted by ticks\n\n**Signs:**\n• High fever (104-107°F)\n• Swollen lymph nodes\n• Difficulty breathing\n• Loss of appetite\n• Anemia\n\n**Prevention:**\n• Tick control using acaricides\n• Vaccination where available\n• Pasture rotation\n\n**Treatment:**\n• Immediate veterinary attention\n• Specific drugs under vet supervision\n• Supportive care (fluids, nutrition)';
    }
    return '🐄 **Cattle Health:** Regular check-ups, vaccination schedule, deworming (every 3-4 months), proper housing, and balanced nutrition are essential for healthy cattle. Consult your veterinarian for a tailored health plan.';
  }
  
  // ==================== GOAT ====================
  if (q.includes('goat')) {
    if (q.includes('feed') || q.includes('nutrition') || q.includes('diet') || q.includes('food')) {
      return '🐐 **Goat Nutrition Guide:**\n\n**Daily Feed:**\n• 2-4 lbs (1-2 kg) of hay per day\n• Grains for pregnant/lactating does\n• Fresh water at all times\n• Mineral blocks (salt, calcium, phosphorus)\n• Browse: leaves, shrubs, tree branches\n\n**Feeding Schedule:**\n• Feed 2-3 times daily\n• Provide fresh water twice daily\n• Clean feed troughs regularly\n\n**Special Needs:**\n• Pregnant does: more protein and minerals\n• Kids: colostrum first 24 hours';
    }
    if (q.includes('disease') || q.includes('sick') || q.includes('problem') || q.includes('ill')) {
      return '🐐 **Common Goat Diseases:**\n\n1. **PPR (Peste des Petits Ruminants)**\n   • Signs: fever, mouth sores, diarrhea, pneumonia\n   • Prevention: Annual vaccination\n\n2. **CCPP (Contagious Caprine Pleuropneumonia)**\n   • Signs: severe coughing, difficulty breathing\n   • Prevention: Vaccination\n\n3. **Internal Parasites**\n   • Signs: weight loss, diarrhea, anemia\n   • Prevention: Regular deworming (every 3-4 months)\n\n4. **Foot Rot**\n   • Signs: limping, swelling between toes\n   • Prevention: Clean, dry housing';
    }
    if (q.includes('preg') || q.includes('pregnancy') || q.includes('kidding')) {
      return '🐐 **Pregnancy & Kidding Guide:**\n\n**Gestation:** ~150 days (5 months)\n\n**Signs of Pregnancy:**\n• Udder development\n• Weight gain\n• Restlessness\n\n**Kidding Preparation:**\n• Prepare clean kidding area\n• Watch for labor signs: udder filling, vaginal discharge, tail relaxation\n• Have vet contact ready\n\n**After Kidding:**\n• Ensure kids suckle within 2 hours\n• Provide colostrum if needed\n• Keep area warm and dry';
    }
    return '🐐 **Goat Health:** Provide proper housing, clean water, balanced nutrition, regular vaccinations (PPR, CCPP), and deworming (every 3-4 months). Monitor for signs of disease and consult a vet when needed.';
  }
  
  // ==================== CHICKEN / POULTRY ====================
  if (q.includes('chicken') || q.includes('poultry') || q.includes('layer') || q.includes('broiler')) {
    if (q.includes('vaccine') || q.includes('vaccination')) {
      return '🐔 **Poultry Vaccination Schedule:**\n\n**Day 1:** Marek\'s disease\n**Week 2-4:** Newcastle disease\n**Week 4:** Infectious Bronchitis (IB)\n**Week 8:** Fowl Pox\n**Layers:** Repeat Newcastle and IB every 3-6 months\n\n**Important:**\n• Keep vaccination records\n• Follow cold chain for vaccines\n• Consult your vet for specific recommendations\n• Monitor for post-vaccine reactions';
    }
    if (q.includes('feed') || q.includes('nutrition') || q.includes('diet') || q.includes('food')) {
      return '🐔 **Poultry Feed Guide:**\n\n**Starter (0-6 weeks):** 20-22% protein\n**Grower (6-20 weeks):** 16-18% protein\n**Layer (>20 weeks):** 16-18% protein + calcium\n\n**Water:**\n• Clean water at all times\n• Add vitamins during stress\n\n**Feed Management:**\n• Provide fresh feed daily\n• Clean feeders regularly\n• Store feed in dry, cool place';
    }
    if (q.includes('disease') || q.includes('sick') || q.includes('problem')) {
      return '🐔 **Common Poultry Diseases:**\n\n1. **Newcastle Disease**\n   • Signs: respiratory distress, diarrhea, drop in egg production\n   • Prevention: Vaccination\n\n2. **Infectious Bronchitis**\n   • Signs: coughing, difficulty breathing, drop in egg production\n   • Prevention: Vaccination\n\n3. **Avian Influenza**\n   • Signs: severe respiratory distress, sudden death\n   • Prevention: Biosecurity, monitoring\n\n4. **Coccidiosis**\n   • Signs: bloody diarrhea, weight loss\n   • Treatment: Anti-coccidials, hygiene';
    }
    return '🐔 **Poultry Health:** Proper housing (ventilation, space), balanced nutrition, clean water, regular vaccination, biosecurity measures, and daily observation for signs of disease. Consult your vet for a health plan.';
  }
  
  // ==================== PIG ====================
  if (q.includes('pig') || q.includes('sow') || q.includes('boar') || q.includes('piglet')) {
    if (q.includes('feed') || q.includes('nutrition') || q.includes('diet') || q.includes('food')) {
      return '🐷 **Pig Nutrition Guide:**\n\n**Protein Requirements:**\n• Weaners: 18-20% protein\n• Growers: 16-18% protein\n• Finishers: 14-16% protein\n\n**Feed Management:**\n• Provide balanced diet with vitamins and minerals\n• Clean water at all times\n• Feed 2-3 times daily\n• Monitor feed intake';
    }
    if (q.includes('preg') || q.includes('pregnancy') || q.includes('farrowing')) {
      return '🐷 **Pregnancy & Farrowing Guide:**\n\n**Gestation:** ~114 days (3 months, 3 weeks, 3 days)\n\n**Signs of Pregnancy:**\n• Weight gain\n• Udder development\n• Nesting behavior\n\n**Farrowing Preparation:**\n• Prepare farrowing area 1 week before\n• Watch for nesting behavior and milk let-down\n• Have vet contact ready\n\n**After Farrowing:**\n• Ensure piglets suckle\n• Provide warm environment\n• Monitor for crushing';
    }
    return '🐷 **Pig Health:** Regular vaccination (PRRS, PCV2, E. coli), deworming (every 3-4 months), proper ventilation, temperature control, and biosecurity. Monitor for signs of respiratory disease and diarrhea.';
  }
  
  // ==================== SHEEP ====================
  if (q.includes('sheep') || q.includes('lamb')) {
    return '🐑 **Sheep Health Guide:**\n\n**Vaccination:**\n• Vaccinate against Clostridial diseases annually\n• Follow local vaccination schedule\n\n**Deworming:**\n• Every 3-4 months\n• Rotate dewormers to prevent resistance\n\n**Nutrition:**\n• Provide mineral blocks\n• Clean water at all times\n• Quality pasture or hay\n\n**Gestation:** ~150 days (5 months)\n\n**Common Issues:**\n• Foot rot: keep area dry, trim hooves\n• Internal parasites: regular deworming';
  }
  
  // ==================== GENERAL ANIMAL HEALTH ====================
  if (q.includes('deworm') || q.includes('parasite') || q.includes('worm') || q.includes('parasite control')) {
    return '💊 **Deworming Guide:**\n\n**Schedule:**\n• Young animals: every 2-3 months\n• Adults: every 3-6 months\n\n**Products:**\n• Albendazole\n• Ivermectin\n• Levamisole\n\n**Important:**\n• Rotate products to prevent resistance\n• Follow weight-based dosing\n• Consult your vet for specific recommendations\n• Monitor for signs of parasite infection';
  }
  
  if (q.includes('vaccine') || q.includes('vaccination')) {
    return '💉 **Vaccination Guide:**\n\n**Cattle:**\n• FMD (Foot-and-Mouth Disease)\n• ECF (East Coast Fever)\n• Blackleg\n\n**Goats:**\n• PPR\n• CCPP\n\n**Poultry:**\n• Newcastle Disease\n• Infectious Bronchitis\n• Marek\'s Disease\n\n**Pigs:**\n• PRRS\n• PCV2\n• E. coli\n\n**General:** Work with your vet to establish a vaccination schedule tailored to your animals and region. Keep vaccination records.';
  }
  
  if (q.includes('sick') || q.includes('ill') || q.includes('disease') || q.includes('health')) {
    return '🩺 **Signs of Sick Animals:**\n\n**Common Symptoms:**\n• Loss of appetite\n• Lethargy\n• Fever\n• Changes in behavior\n• Abnormal discharges\n• Diarrhea\n• Coughing\n• Weight loss\n• Rough hair coat\n• Decreased production (milk, eggs)\n\n**Action Steps:**\n1. Isolate sick animals immediately\n2. Contact a veterinarian\n3. Keep records of symptoms\n4. Maintain good hygiene\n5. Monitor other animals';
  }
  
  // ==================== ADMIN SPECIFIC ====================
  if (q.includes('user') && (q.includes('count') || q.includes('many') || q.includes('how many'))) {
    return '📊 **System Users:**\n\n**User Roles:**\n• Farmers - Animal owners\n• Veterinarians - Healthcare providers\n• District Admins - Local administrators\n• Super Admins - System administrators\n\n**Statistics:**\n• View user statistics in the admin dashboard\n• Track active vs inactive users\n• Monitor user registrations\n\n**Management:**\n• Approve new users\n• Assign roles and permissions\n• Manage user status (active/suspended)';
  }
  
  if (q.includes('report') || q.includes('metrics') || q.includes('analytics') || q.includes('statistics')) {
    return '📊 **System Reports & Metrics:**\n\n**Key Metrics:**\n• Total animals registered\n• Active users\n• Pending requests\n• Appointment statistics\n\n**Reports Available:**\n• User activity reports\n• Animal health reports\n• Request and appointment reports\n• Performance metrics\n\n**Access:**\n• Check the Reports section in the admin dashboard\n• Export data for further analysis';
  }
  
  if (q.includes('role') || q.includes('permission') || q.includes('access')) {
    return '👤 **User Roles & Permissions:**\n\n**Roles:**\n1. **Farmers**\n   • Manage own animals\n   • Request veterinary services\n   • Book appointments\n   • Chat with vets\n\n2. **Veterinarians**\n   • Manage animal health records\n   • Respond to requests\n   • Manage appointments\n   • Provide health advice\n\n3. **District Admins**\n   • Manage users in district\n   • View reports\n   • Approve registrations\n\n4. **Super Admins**\n   • Full system access\n   • Manage all users\n   • Configure system settings';
  }
  
  if (q.includes('vet') || q.includes('veterinarian') || q.includes('service') || q.includes('consult')) {
    return '🩺 **Veterinary Services:**\n\n**Services Available:**\n• Health consultations\n• Emergency services\n• Treatment plans\n• Vaccination programs\n• Deworming services\n• Farm visits\n\n**How to Access:**\n1. Submit a request via the app\n2. Book an appointment\n3. Chat with a veterinarian\n4. Track treatment progress\n\n**Benefits:**\n• Professional advice\n• Quick response\n• Affordable services\n• Trusted veterinarians';
  }
  
  // ==================== Default Response ====================
  return '🤖 **I\'m your Veterinary Assistant!**\n\nI can help with:\n\n• 🐄 **Cattle:** Health, diseases, nutrition, calving, milk production\n• 🐐 **Goats:** Care, feeding, diseases, kidding\n• 🐔 **Poultry:** Vaccination, feeding, disease management\n• 🐷 **Pigs:** Health, nutrition, farrowing\n• 🐑 **Sheep:** Health, vaccination, deworming\n• 💊 **Deworming & Vaccination:** Schedules and best practices\n• 📊 **System Insights:** User management, reports, analytics (for admins)\n\n**Try asking:**\n"How to treat a sick cow?"\n"What should I feed my goats?"\n"When to vaccinate chickens?"\n"How many users in the system?"';
};

/**
 * =========================
 * ASK AI QUESTION
 * =========================
 * POST /api/ai-chat/ask
 */
export const askAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
      return;
    }

    if (!question || !question.trim()) {
      res.status(400).json({ 
        success: false, 
        message: 'Question is required' 
      });
      return;
    }

    console.log(`🤖 AI Question from user ${userId}: ${question}`);

    // Get AI response
    const answer = getAIResponse(question);

    // Save to history
    try {
      await pool.query(
        `INSERT INTO ai_chat_history (user_id, question, answer, created_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, question.trim(), answer]
      );
      console.log(`✅ AI history saved for user ${userId}`);
    } catch (dbError) {
      console.log('⚠️ Could not save to history:', dbError);
      // Continue anyway - don't fail the request
    }

    res.status(200).json({
      success: true,
      data: {
        question: question.trim(),
        answer: answer,
        created_at: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('❌ Ask AI error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get AI response',
      error: error.message 
    });
  }
};

/**
 * =========================
 * GET AI CHAT HISTORY
 * =========================
 * GET /api/ai-chat/history
 */
export const getAIHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const limit = Number(req.query.limit) || 20;

    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
      return;
    }

    const [history] = await pool.query(
      `SELECT id, user_id, question, answer, created_at
       FROM ai_chat_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('❌ Get AI history error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get AI history',
      error: error.message 
    });
  }
};