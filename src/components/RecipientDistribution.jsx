import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, ResponsiveContainer, Legend, Cell, Tooltip } from 'recharts';
import { Loader2 } from "lucide-react";
import { statsApi } from "@/services/api";

export const RecipientDistribution = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await statsApi.getStats();
        
        // Ensure data.byOrganization exists and is an array
        const organizationData = data?.byOrganization || [];
        
        // Transform data and handle potential missing properties
        const transformedData = Array.isArray(organizationData) 
          ? organizationData
              .filter(org => org && (org.name !== undefined || org.count !== undefined)) // Filter out invalid entries
              .map(org => ({
                name: org.name || 'No Organization',
                value: org.count || 0
              }))
              .sort((a, b) => b.value - a.value) // Sort by count descending
          : [];

        setStats({
          ...data,
          byOrganization: transformedData
        });
      } catch (err) {
        setError(err.message || 'Failed to load contact statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4">
        <h2 className="text-2xl font-bold">Contact Distribution</h2>
        <Card className="p-6 flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h2 className="text-2xl font-bold">Contact Distribution</h2>
        <Card className="p-6 flex items-center justify-center h-[300px] text-red-500">
          {error}
        </Card>
      </div>
    );
  }

  // Additional check for empty or invalid stats
  if (!stats?.byOrganization || !Array.isArray(stats.byOrganization) || stats.byOrganization.length === 0) {
    return (
      <div className="grid gap-4">
        <h2 className="text-2xl font-bold">Contact Distribution</h2>
        <Card className="p-6 flex items-center justify-center h-[300px] text-gray-500">
          No organization data available
        </Card>
      </div>
    );
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null; // Don't show labels for small segments

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid gap-4">
      <h2 className="text-2xl font-bold">Contact Distribution</h2>
      <Card className="p-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.byOrganization}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.byOrganization.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default RecipientDistribution;