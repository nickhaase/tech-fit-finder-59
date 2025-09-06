import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, ArrowRight } from "lucide-react";
import { IntegrationDetail } from "@/types/assessment";
import { PROTOCOLS } from "@/data/brandCatalogs";

interface FollowUpQuestionsProps {
  brandName: string;
  category: 'erp' | 'sensors' | 'automation' | 'other' | 'data_analytics';
  subcategory?: string;
  currentDetails?: Partial<IntegrationDetail>;
  onComplete: (details: IntegrationDetail) => void;
  onClose: () => void;
  mode: 'quick' | 'advanced';
}

export const FollowUpQuestions = ({ 
  brandName, 
  category, 
  subcategory,
  currentDetails = {},
  onComplete, 
  onClose,
  mode 
}: FollowUpQuestionsProps) => {
  const [details, setDetails] = useState<Partial<IntegrationDetail>>({
    brand: brandName,
    ...currentDetails
  });

  const handleComplete = () => {
    onComplete(details as IntegrationDetail);
    onClose();
  };

  const updateDetail = (key: keyof IntegrationDetail, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof IntegrationDetail, item: string) => {
    const currentArray = (details[key] as string[]) || [];
    updateDetail(key, 
      currentArray.includes(item) 
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item]
    );
  };

  const renderERPQuestions = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Edition/Version</Label>
        <Input
          placeholder="e.g., S/4HANA, Cloud, On-Premise"
          value={details.edition || ''}
          onChange={(e) => updateDetail('edition', e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-base font-medium">Environment</Label>
        <RadioGroup 
          value={details.environment || ''} 
          onValueChange={(value) => updateDetail('environment', value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cloud" id="cloud" />
            <Label htmlFor="cloud">Cloud</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="on-prem" id="on-prem" />
            <Label htmlFor="on-prem">On-Premise</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hybrid" id="hybrid" />
            <Label htmlFor="hybrid">Hybrid</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === 'advanced' && (
        <>
          <div>
            <Label className="text-base font-medium">Integration Methods</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['REST API', 'SOAP', 'OData', 'SFTP/CSV', 'JDBC'].map(method => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={method}
                    checked={(details.method || []).includes(method)}
                    onCheckedChange={() => toggleArrayItem('method', method)}
                  />
                  <Label htmlFor={method}>{method}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Data to Sync</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Work Orders', 'Assets', 'Parts/Inventory', 'Vendors', 'Costs', 'Users'].map(obj => (
                <div key={obj} className="flex items-center space-x-2">
                  <Checkbox
                    id={obj}
                    checked={(details.objects || []).includes(obj)}
                    onCheckedChange={() => toggleArrayItem('objects', obj)}
                  />
                  <Label htmlFor={obj}>{obj}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Data Flow Direction</Label>
            <RadioGroup 
              value={details.directionality || ''} 
              onValueChange={(value) => updateDetail('directionality', value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-way-to" id="one-way-to" />
                <Label htmlFor="one-way-to">One-way to MaintainX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-way-from" id="one-way-from" />
                <Label htmlFor="one-way-from">One-way from MaintainX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bidirectional" id="bidirectional" />
                <Label htmlFor="bidirectional">Bi-directional</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Sync Frequency</Label>
            <RadioGroup 
              value={details.frequency || ''} 
              onValueChange={(value) => updateDetail('frequency', value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="real-time" id="real-time" />
                <Label htmlFor="real-time">Real-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="near-real-time" id="near-real-time" />
                <Label htmlFor="near-real-time">Near real-time (minutes)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled">Scheduled batch</Label>
              </div>
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );

  const renderSensorQuestions = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Communication Protocol</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['MQTT', 'OPC UA', 'Modbus/TCP', 'REST API', 'HTTP/HTTPS'].map(protocol => (
            <div key={protocol} className="flex items-center space-x-2">
              <Checkbox
                id={protocol}
                checked={(details.protocol || []).includes(protocol)}
                onCheckedChange={() => toggleArrayItem('protocol', protocol)}
              />
              <Label htmlFor={protocol}>{protocol}</Label>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <>
          <div>
            <Label className="text-base font-medium">Data Types Collected</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Temperature', 'Pressure', 'Vibration', 'Flow', 'Level', 'Power', 'Speed', 'Other'].map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={(details.dataTypes || []).includes(type)}
                    onCheckedChange={() => toggleArrayItem('dataTypes', type)}
                  />
                  <Label htmlFor={type}>{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Sampling Rate</Label>
            <Input
              placeholder="e.g., 1 second, 5 minutes, hourly"
              value={details.sampling || ''}
              onChange={(e) => updateDetail('sampling', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Gateway/Connector Used</Label>
            <Input
              placeholder="e.g., Kepware, custom gateway, direct connection"
              value={details.gateway || ''}
              onChange={(e) => updateDetail('gateway', e.target.value)}
              className="mt-2"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderAutomationQuestions = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Communication Protocol</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['OPC UA', 'OPC DA', 'MQTT', 'Modbus/TCP', 'REST API', 'JDBC'].map(protocol => (
            <div key={protocol} className="flex items-center space-x-2">
              <Checkbox
                id={protocol}
                checked={(details.protocol || []).includes(protocol)}
                onCheckedChange={() => toggleArrayItem('protocol', protocol)}
              />
              <Label htmlFor={protocol}>{protocol}</Label>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <>
          <div>
            <Label className="text-base font-medium">Data Available</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Tags/Variables', 'Alarms', 'Events', 'Batches', 'OEE Data', 'Production Counts'].map(data => (
                <div key={data} className="flex items-center space-x-2">
                  <Checkbox
                    id={data}
                    checked={(details.dataTypes || []).includes(data)}
                    onCheckedChange={() => toggleArrayItem('dataTypes', data)}
                  />
                  <Label htmlFor={data}>{data}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Environment</Label>
            <RadioGroup 
              value={details.environment || ''} 
              onValueChange={(value) => updateDetail('environment', value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on-prem" id="auto-on-prem" />
                <Label htmlFor="auto-on-prem">On-Premise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cloud" id="auto-cloud" />
                <Label htmlFor="auto-cloud">Cloud</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="auto-hybrid" />
                <Label htmlFor="auto-hybrid">Hybrid</Label>
              </div>
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );

  const renderOtherQuestions = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Integration Method</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['REST API', 'SOAP', 'Webhooks', 'SFTP/CSV', 'Database Sync'].map(method => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                id={method}
                checked={(details.method || []).includes(method)}
                onCheckedChange={() => toggleArrayItem('method', method)}
              />
              <Label htmlFor={method}>{method}</Label>
            </div>
          ))}
        </div>
      </div>

      {mode === 'advanced' && (
        <>
          <div>
            <Label className="text-base font-medium">Objects to Sync</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Assets', 'Inventory', 'Tickets', 'Users', 'Suppliers', 'Documents'].map(obj => (
                <div key={obj} className="flex items-center space-x-2">
                  <Checkbox
                    id={obj}
                    checked={(details.objects || []).includes(obj)}
                    onCheckedChange={() => toggleArrayItem('objects', obj)}
                  />
                  <Label htmlFor={obj}>{obj}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Sync Frequency</Label>
            <RadioGroup 
              value={details.frequency || ''} 
              onValueChange={(value) => updateDetail('frequency', value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="real-time" id="other-real-time" />
                <Label htmlFor="other-real-time">Real-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="other-scheduled" />
                <Label htmlFor="other-scheduled">Scheduled</Label>
              </div>
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );

  const renderQuestions = () => {
    switch (category) {
      case 'erp':
        return renderERPQuestions();
      case 'sensors':
        return renderSensorQuestions();
      case 'automation':
        return renderAutomationQuestions();
      case 'other':
        return renderOtherQuestions();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden bg-gradient-card">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">{brandName} Integration Details</h3>
              <p className="text-sm text-muted-foreground">
                Help us understand your {brandName} setup for better integration recommendations
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {renderQuestions()}
        </div>

        <div className="p-6 border-t border-border/50">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={onClose}>
              Skip for now
            </Button>
            <Button onClick={handleComplete} variant="gradient">
              Save Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};