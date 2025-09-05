import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssessmentService } from "@/services/assessmentService";
import { Assessment } from "@/types/database";
import { Search, ExternalLink, Calendar, Building, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const SubmissionsManager = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    // Filter assessments based on search term
    const filtered = assessments.filter(assessment => {
      const searchLower = searchTerm.toLowerCase();
      const companyName = assessment.company?.name?.toLowerCase() || '';
      const industry = assessment.assessment_data?.company?.industry?.toLowerCase() || '';
      const size = assessment.assessment_data?.company?.size?.toLowerCase() || '';
      
      return companyName.includes(searchLower) || 
             industry.includes(searchLower) || 
             size.includes(searchLower);
    });
    
    setFilteredAssessments(filtered);
  }, [assessments, searchTerm]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await AssessmentService.getAllAssessments();
      setAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const openAssessment = (uniqueUrl: string) => {
    window.open(`/assessment/${uniqueUrl}`, '_blank');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'startup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'small': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: assessments.length,
    withCompany: assessments.filter(a => a.company?.name).length,
    avgIntegrations: assessments.length > 0 
      ? Math.round(assessments.reduce((sum, a) => sum + (a.assessment_data?.scorecard?.integrationsFound || 0), 0) / assessments.length)
      : 0,
    avgCompatibility: assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + (a.assessment_data?.scorecard?.compatibilityPercent || 0), 0) / assessments.length)
      : 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">With Company Info</p>
                <p className="text-2xl font-bold">{stats.withCompany}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Integrations</p>
                <p className="text-2xl font-bold">{stats.avgIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Compatibility</p>
                <p className="text-2xl font-bold">{stats.avgCompatibility}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assessment Submissions</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, industry, or size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
              <Button variant="outline" onClick={loadAssessments}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading assessments...</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No assessments match your search." : "No assessments submitted yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Integrations</TableHead>
                  <TableHead>Compatibility</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.map((assessment) => {
                  const data = assessment.assessment_data;
                  const scorecard = data?.scorecard;
                  
                  return (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {assessment.company?.logo_url && (
                            <img 
                              src={assessment.company.logo_url} 
                              alt={`${assessment.company.name} logo`}
                              className="w-6 h-6 rounded object-contain"
                            />
                          )}
                          <span>{assessment.company?.name || 'Anonymous'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {data?.company?.industry || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSizeColor(data?.company?.size || '')}>
                          {data?.company?.size || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {scorecard?.integrationsFound || 0}
                      </TableCell>
                      <TableCell>
                        {scorecard?.compatibilityPercent || 0}%
                      </TableCell>
                      <TableCell>
                        <Badge className={getComplexityColor(scorecard?.complexity || '')}>
                          {scorecard?.complexity || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(assessment.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssessment(assessment.unique_url)}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};