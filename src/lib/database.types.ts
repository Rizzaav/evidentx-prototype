export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          category: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          name: string;
          email: string;
          program: string;
          year: string;
          university: string;
          bio: string | null;
          avatar_color: string | null;
          interests: string[];
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          program: string;
          year: string;
          university: string;
          bio?: string | null;
          avatar_color?: string | null;
          interests?: string[];
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          program?: string;
          year?: string;
          university?: string;
          bio?: string | null;
          avatar_color?: string | null;
          interests?: string[];
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidence: {
        Row: {
          id: string;
          student_id: string;
          type: string;
          title: string;
          description: string | null;
          issuer: string;
          date: string;
          verification: string;
          strength: number;
          score: string | null;
          url: string | null;
          skills: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          student_id: string;
          type: string;
          title: string;
          description?: string | null;
          issuer: string;
          date: string;
          verification?: string;
          strength?: number;
          score?: string | null;
          url?: string | null;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          type?: string;
          title?: string;
          description?: string | null;
          issuer?: string;
          date?: string;
          verification?: string;
          strength?: number;
          score?: string | null;
          url?: string | null;
          skills?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          }
        ];
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          organization: string;
          location: string;
          type: string;
          duration: string;
          stipend: string;
          description: string;
          posted_by: string;
          posted_date: string;
          required_skills: string[];
          preferred_skills: string[];
          min_evidence_strength: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          organization: string;
          location: string;
          type: string;
          duration: string;
          stipend: string;
          description: string;
          posted_by: string;
          posted_date?: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_evidence_strength?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          organization?: string;
          location?: string;
          type?: string;
          duration?: string;
          stipend?: string;
          description?: string;
          posted_by?: string;
          posted_date?: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_evidence_strength?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          student_id: string;
          opportunity_id: string;
          applied_date: string;
          status: string;
          match_score_at_apply: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          student_id: string;
          opportunity_id: string;
          applied_date?: string;
          status?: string;
          match_score_at_apply?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          opportunity_id?: string;
          applied_date?: string;
          status?: string;
          match_score_at_apply?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          title: string;
          organization: string;
          description: string;
          required_skills: string[];
          created_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          organization: string;
          description: string;
          required_skills?: string[];
          created_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          organization?: string;
          description?: string;
          required_skills?: string[];
          created_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_roles: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          description: string | null;
          required_skills: string[];
        };
        Insert: {
          id: string;
          team_id: string;
          name: string;
          description?: string | null;
          required_skills?: string[];
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          description?: string | null;
          required_skills?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "team_roles_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
