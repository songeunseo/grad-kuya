import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Course {
  id: string;
  name: string;
  type: string;
  credits: number;
  semester: string;
  Advanced_tag?: '선도적세계인' | '실천적사회인' | '창의적전문인';
  Basic_tag?: '글쓰기' | '외국어' | 'S/W' | '인성';
  user_id?: string;
  created_at?: string;
}

export async function getCourses(userId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  
  return data || [];
}

export async function addCourse(course: Omit<Course, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select();
  
  if (error) {
    console.error('Error adding course:', error);
    return null;
  }
  
  return data ? data[0] : null;
}

export async function updateCourse(course: Course) {
  const { data, error } = await supabase
    .from('courses')
    .update(course)
    .eq('id', course.id)
    .select();
  
  if (error) {
    console.error('Error updating course:', error);
    return null;
  }
  
  return data ? data[0] : null;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }
  
  return true;
}

export async function migrateLocalStorageToDB(userId: string) {
  const coursesJson = localStorage.getItem('courses');
  if (!coursesJson) return;
  
  try {
    const courses = JSON.parse(coursesJson) as Course[];
    const coursesWithUserId = courses.map(course => ({
      ...course,
      user_id: userId
    }));
    
    const { error } = await supabase
      .from('courses')
      .insert(coursesWithUserId);
    
    if (error) {
      console.error('Error migrating data:', error);
    } else {
      console.log('Data migrated successfully');
      localStorage.removeItem('courses'); // Clear localStorage after successful migration
    }
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }
} 