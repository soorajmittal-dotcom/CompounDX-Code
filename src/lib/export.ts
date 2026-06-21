import { db } from './db';

export async function exportAllData(): Promise<string> {
  const [workouts, exercises, nutrition, settings] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.where('isCustom').equals(1).toArray(),
    db.nutrition.toArray(),
    db.settings.get('user-settings'),
  ]);

  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), workouts, exercises, nutrition, settings }, null, 2);
}

export async function importData(json: string): Promise<{ workouts: number; nutrition: number }> {
  const data = JSON.parse(json);

  if (!data.version || !data.workouts) {
    throw new Error('Invalid data format');
  }

  let workoutsImported = 0;
  let nutritionImported = 0;

  if (data.workouts?.length) {
    await db.workouts.bulkPut(data.workouts);
    workoutsImported = data.workouts.length;
  }

  if (data.nutrition?.length) {
    await db.nutrition.bulkPut(data.nutrition);
    nutritionImported = data.nutrition.length;
  }

  if (data.settings) {
    await db.settings.put({ ...data.settings, id: 'user-settings' });
  }

  return { workouts: workoutsImported, nutrition: nutritionImported };
}
