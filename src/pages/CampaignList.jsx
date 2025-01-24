import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PlayCircle, Trash2, Edit, FolderX, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { campaignApi } from "../../services/api"
import UpdateCampaignForm from "@/components/UpdateCampaignForm"
import { Link } from "react-router-dom"

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  sending: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [campaignToUpdate, setCampaignToUpdate] = useState(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await campaignApi.getAll()
      setCampaigns(response.campaigns)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setError("Failed to fetch campaigns. Please try again.")
      toast.error("Failed to fetch campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleExecute = async (id) => {
    if (!id) return
    try {
      await campaignApi.execute(id)
      toast.success("Campaign executed successfully")
      fetchCampaigns()
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to execute campaign"
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Invalid campaign ID")
      return
    }

    try {
      setDeleteLoading(true)
      await campaignApi.delete(id)
      toast.success("Campaign deleted successfully")
      fetchCampaigns()
      setSelectedCampaignId(null)
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete campaign"
      toast.error(errorMessage)

      if (error.response?.status === 400) {
        toast.error("Only draft campaigns can be deleted")
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUpdate = (campaign) => {
    if (campaign && campaign._id) {
      setCampaignToUpdate(campaign)
      setIsUpdateModalOpen(true)
    } else {
      toast.error("Invalid campaign data")
    }
  }

  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false)
    setCampaignToUpdate(null)
    fetchCampaigns()
    toast.success("Campaign updated successfully")
  }

  const canDeleteCampaign = (status) => status === "draft"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Error</h2>
        <p className="mb-6 text-gray-600">{error}</p>
        <Button onClick={fetchCampaigns} className="px-6 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Campaign Management</h1>
        <Button asChild className="px-4 py-2 text-white rounded-full">
          <Link to="/campaigns/create">
            <Plus className="w-5 h-5 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="overflow-hidden bg-white rounded-lg shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FolderX className="w-24 h-24 mb-6 text-gray-400" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-700">No Campaigns Found</h2>
            <p className="mb-6 text-gray-500">
              You haven't created any campaigns yet. Start by creating your first campaign.
            </p>
            <Button asChild className="px-6 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600">
              <Link to="/campaigns/create">Create Your First Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden bg-white rounded-lg shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="py-4 font-semibold text-gray-700 text-xm">Name</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-700 text-xm">Status</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-700 text-xm">Created</TableHead>
                  <TableHead className="py-4 font-semibold text-gray-700 text-xm">Last Executed</TableHead>
                  <TableHead className="py-4 font-semibold text-right text-gray-700 text-xm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <TableCell className="py-4 font-medium text-gray-800">{campaign.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 text-xm font-medium rounded-full ${
                          statusColors[campaign.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status.charAt(0).toLowerCase() + campaign.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-gray-600">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-gray-600">
                      {campaign.lastExecuted ? new Date(campaign.lastExecuted).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecute(campaign._id)}
                          title="Execute Campaign"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdate(campaign)}
                          title="Update Campaign"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              title="Delete Campaign"
                              disabled={!canDeleteCampaign(campaign.status)}
                              onClick={() => setSelectedCampaignId(campaign._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white rounded-lg shadow-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-bold text-gray-800">
                                Delete Campaign
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                Are you sure you want to delete this campaign? This action cannot be undone.
                                {!canDeleteCampaign(campaign.status) && (
                                  <p className="mt-2 font-medium text-red-600">
                                    Note: Only draft campaigns can be deleted.
                                  </p>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setSelectedCampaignId(null)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(selectedCampaignId)}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                                disabled={deleteLoading || !canDeleteCampaign(campaign.status)}
                              >
                                {deleteLoading ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {isUpdateModalOpen && campaignToUpdate && (
        <UpdateCampaignForm
          campaign={campaignToUpdate}
          onClose={() => {
            setIsUpdateModalOpen(false)
            setCampaignToUpdate(null)
          }}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}

export default CampaignList

