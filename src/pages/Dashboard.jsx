import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link } from "react-router-dom"
import { fetchCampaigns } from "../services/api"
import { Loader2, Filter, RefreshCw } from "lucide-react"
import { KeyMetrics } from "@/components/KeyMetrics"
import { RecipientDistribution } from "@/components/RecipientDistribution"
import { CampaignTable } from "@/components/CampaignTable"

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  })

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetchCampaigns(filters)
      setCampaigns(response.campaigns)
      setError(null)
    } catch (error) {
      setError("Failed to load campaigns. Please try again.")
      console.error("Error fetching campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [filters])

  const handleStatusFilter = (status) => {
    setFilters((prev) => ({ ...prev, status }))
  }

  const handleSearch = (search) => {
    setFilters((prev) => ({ ...prev, search }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
        <Button onClick={loadCampaigns} className="ml-4">
          <RefreshCw className="mr-2" /> Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Email Campaign Overview</p>
        </div>
        <Button asChild>
          <Link to="/campaigns/create">Create Campaign</Link>
        </Button>
      </div>

      <div className="flex mb-4 space-x-4">
        <Input
          placeholder="Search campaigns..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-grow"
        />
        <Select onValueChange={handleStatusFilter} value={filters.status}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <KeyMetrics campaigns={campaigns} />
      <RecipientDistribution campaigns={campaigns} />
      <CampaignTable campaigns={campaigns} onRefresh={loadCampaigns} />
    </div>
  )
}

export default Dashboard

