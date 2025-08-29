// Context7風のベクトル検索サービス
// Upstash Vector DB統合

interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content: string;
}

interface SearchOptions {
  topK?: number;
  threshold?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export class VectorSearchService {
  private baseUrl: string;
  private token: string;

  constructor(restUrl?: string, restToken?: string) {
    this.baseUrl = restUrl || process.env.UPSTASH_VECTOR_REST_URL || '';
    this.token = restToken || process.env.UPSTASH_VECTOR_REST_TOKEN || '';
    
    if (!this.baseUrl || !this.token) {
      console.warn('Upstash Vector credentials not configured');
    }
  }

  async embedText(text: string): Promise<number[]> {
    // OpenAI Embeddings APIを使用
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  async upsert(id: string, vector: number[], metadata: Record<string, any> = {}): Promise<void> {
    if (!this.baseUrl || !this.token) return;

    await fetch(`${this.baseUrl}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vectors: [{
          id,
          vector,
          metadata
        }]
      })
    });
  }

  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    if (!this.baseUrl || !this.token) {
      // フォールバック：ローカル検索
      return this.fallbackSearch(query, options);
    }

    try {
      const queryVector = await this.embedText(query);
      
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVector,
          topK: options.topK || 10,
          includeMetadata: options.includeMetadata !== false,
          filter: options.filter
        })
      });

      const data = await response.json();
      
      return data.matches
        .filter((match: any) => match.score >= (options.threshold || 0.5))
        .map((match: any) => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata || {},
          content: match.metadata?.content || ''
        }));
    } catch (error) {
      console.error('Vector search failed:', error);
      return this.fallbackSearch(query, options);
    }
  }

  // 医療知識検索用の特別メソッド
  async searchMedicalKnowledge(
    query: string,
    specialty?: string
  ): Promise<VectorSearchResult[]> {
    const filter: Record<string, any> = { type: 'medical_knowledge' };
    if (specialty) {
      filter.specialty = specialty;
    }

    return this.search(query, {
      topK: 5,
      threshold: 0.7,
      filter
    });
  }

  // 患者記録検索
  async searchPatientRecords(
    query: string,
    patientId: string
  ): Promise<VectorSearchResult[]> {
    return this.search(query, {
      topK: 10,
      threshold: 0.6,
      filter: { 
        type: 'patient_record',
        patient_id: patientId 
      }
    });
  }

  // 薬剤情報検索
  async searchMedications(
    query: string,
    activeIngredient?: string
  ): Promise<VectorSearchResult[]> {
    const filter: Record<string, any> = { type: 'medication' };
    if (activeIngredient) {
      filter.active_ingredient = activeIngredient;
    }

    return this.search(query, {
      topK: 8,
      threshold: 0.75,
      filter
    });
  }

  private fallbackSearch(query: string, options: SearchOptions): VectorSearchResult[] {
    // Upstashが利用できない場合の簡易検索
    console.log('Using fallback search for:', query);
    return [];
  }

  // 医療知識をベクトルDBに追加
  async indexMedicalContent(content: {
    id: string;
    title: string;
    content: string;
    specialty: string;
    type: 'guideline' | 'drug_info' | 'disease_info' | 'procedure';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const vector = await this.embedText(`${content.title} ${content.content}`);
      
      await this.upsert(content.id, vector, {
        title: content.title,
        content: content.content,
        specialty: content.specialty,
        type: 'medical_knowledge',
        subtype: content.type,
        indexed_at: new Date().toISOString(),
        ...content.metadata
      });
    } catch (error) {
      console.error('Failed to index medical content:', error);
    }
  }
}

// シングルトンインスタンス
export const vectorSearch = new VectorSearchService();