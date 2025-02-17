import { Card, CardContent } from "@/components/ui/card";
import { statsApi } from "@/services/api";
import { Users, Mail, BarChart2, Tags, FileText, Contact, Send, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

export const KeyMetrics = ({ campaigns, contactStats, templates, contacts }) => {
  const totalContacts = campaigns.reduce((total, campaign) => total + (campaign.contacts?.length || 0), 0);

  const averageOpenRate = campaigns.length
    ? Math.round(
        campaigns.reduce((sum, c) => sum + ((c.stats?.opened / c.stats?.sent) * 100 || 0), 0) / campaigns.length
      )
    : 0;

  const scheduledCampaigns = campaigns.filter((c) => c.scheduledDate && new Date(c.scheduledDate) > new Date()).length;

  const [stats, setStats] = useState({
    totalContacts: 0,
    totalTemplates: 0,
    totalEmailsSent: 0,
    totalTags: 0, // Added total tags
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Contacts"
        value={stats.totalContacts.toLocaleString()}
        description="Active subscribers"
        icon={<Contact className="w-8 h-8 text-orange-500" />}
        trend="+5% growth rate"
        color="bg-orange-50"
      />
      <MetricCard
        title="Active Campaigns"
        value={campaigns.filter((c) => c.status === "sending").length}
        description="Currently sending"
        icon={<Send className="w-8 h-8 text-green-500" />}
        trend="2 completing soon"
        color="bg-green-50"
      />
      <MetricCard
        title="Total Templates"
        value={stats.totalTemplates.toLocaleString()}
        description="Reusable email templates"
        icon={<FileText className="w-8 h-8 text-purple-500" />}
        trend="3 recently added"
        color="bg-purple-50"
      />
      <MetricCard
        title="Average Open Rate"
        value={`${averageOpenRate}%`}
        description="All campaigns"
        icon={<BarChart2 className="w-8 h-8 text-indigo-500" />}
        trend="↑ 3% increase"
        color="bg-indigo-50"
      />
      <MetricCard
        title="Total Tags"
        value={stats.tags} // Now using fetched stats
        description="Contact categories"
        icon={<Tags className="w-8 h-8 text-pink-500" />}
        trend="2 new categories"
        color="bg-pink-50"
      />
      <MetricCard
        title="Scheduled Campaigns"
        value={scheduledCampaigns}
        description="Upcoming campaigns"
        icon={<Calendar className="w-8 h-8 text-teal-500" />}
        trend="Next: Tomorrow"
        color="bg-teal-50"
      />
      <MetricCard
        title="Total Emails Sent"
        value={stats.totalEmailsSent.toLocaleString()}
        description="Emails delivered"
        icon={<Mail className="w-8 h-8 text-rose-500" />}
        trend="98.5% success rate"
        color="bg-rose-50"
      />
    </div>
  );
};

const MetricCard = ({ title, value, description, icon, trend, color }) => (
  <Card className="overflow-hidden">
    <CardContent className={`pt-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold">{value}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <p className="mt-2 text-xs font-medium text-emerald-600">{trend}</p>
        </div>
        <div className="p-2 rounded-full shadow-sm bg-white/80">{icon}</div>
      </div>
    </CardContent>
  </Card>
);
