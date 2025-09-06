import { AssessmentData } from '@/types/assessment';

// URL-based assessment sharing utilities
export class URLSharingService {
  /**
   * Encode assessment data into a URL-safe string
   */
  static encodeAssessmentData(data: AssessmentData): string {
    try {
      const jsonString = JSON.stringify(data);
      // Use base64 encoding for URL safety
      const encoded = btoa(jsonString);
      return encoded;
    } catch (error) {
      console.error('Failed to encode assessment data:', error);
      throw new Error('Failed to encode assessment data');
    }
  }

  /**
   * Decode assessment data from URL parameter
   */
  static decodeAssessmentData(encodedData: string): AssessmentData | null {
    try {
      const decoded = atob(encodedData);
      const data = JSON.parse(decoded) as AssessmentData;
      return data;
    } catch (error) {
      console.error('Failed to decode assessment data:', error);
      return null;
    }
  }

  /**
   * Generate a shareable URL with encoded assessment data
   */
  static generateShareableURL(data: AssessmentData): string {
    const encoded = this.encodeAssessmentData(data);
    return `${window.location.origin}/share?data=${encoded}`;
  }

  /**
   * Extract assessment data from URL parameters
   */
  static getAssessmentFromURL(): AssessmentData | null {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (!encodedData) {
      return null;
    }

    return this.decodeAssessmentData(encodedData);
  }
}