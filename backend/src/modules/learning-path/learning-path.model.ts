export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LearningStep[];
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningStep {
  id: string;
  title: string;
  description: string;
  content: string;
  resources: string[];
  order: number;
}

// Placeholder for LearningPath model implementation
// This will be replaced with actual database schema/model implementation
export class LearningPathModel {
  // Placeholder methods
  static async findById(id: string): Promise<LearningPath | null> {
    // Implementation will be added later
    return null;
  }

  static async findAll(): Promise<LearningPath[]> {
    // Implementation will be added later
    return [];
  }

  static async create(pathData: Partial<LearningPath>): Promise<LearningPath> {
    // Implementation will be added later
    return {} as LearningPath;
  }

  static async update(id: string, pathData: Partial<LearningPath>): Promise<LearningPath | null> {
    // Implementation will be added later
    return null;
  }

  static async delete(id: string): Promise<boolean> {
    // Implementation will be added later
    return false;
  }
} 