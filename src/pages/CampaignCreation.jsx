import { useState, useEffect, useCallback } from "react"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Mail, Users, Calendar, ArrowLeft, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { useNavigate } from "react-router-dom"
import { campaignApi, contactApi, templateApi } from "@/services/api"
const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  templateId: z.string().min(1, "Please select a template"),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  scheduledDate: z.date().nullable(),
})
const CampaignCreation = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    templateId: "",
    recipients: [],
    scheduledDate: null,
  })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectAll, setSelectAll] = useState(false)
  const getDatesForMonth = useCallback(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 31; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [])

  const steps = [
    { title: "Campaign Name", icon: Mail },
    { title: "Select Template", icon: CheckCircle2 },
    { title: "Add Recipients", icon: Users },
    { title: "Schedule", icon: Calendar },
  ]
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesResponse, contactsResponse] = await Promise.all([templateApi.getAll(), contactApi.getAll()])
        const templatesData = templatesResponse.data.templates || templatesResponse.data
        const contactsData = contactsResponse.data.contacts || contactsResponse.data
        if (!Array.isArray(templatesData) || !Array.isArray(contactsData)) {
          throw new Error("Invalid data format")
        }
        setTemplates(templatesData)
        setContacts(contactsData)
      } catch (error) {
        console.error("Data fetching error:", error)
        toast.error("Failed to load necessary data")
      } finally {
        setTemplatesLoading(false)
        setContactsLoading(false)
      }
    }
    fetchData()
  }, [])
  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find((t) => t._id === formData.templateId)
      setSelectedTemplate(template)
    }
  }, [formData.templateId, templates])
  const validateStep = (currentStep) => {
    try {
      if (currentStep === 1) {
        z.object({
          name: campaignSchema.shape.name,
        }).parse({ name: formData.name })
      } else if (currentStep === 2) {
        z.object({
          templateId: campaignSchema.shape.templateId,
        }).parse({ templateId: formData.templateId })
      } else if (currentStep === 3) {
        campaignSchema.shape.recipients.parse(formData.recipients)
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message)
        })
      }
      return false
    }
  }
  const handleSelectAll = useCallback(
    (checked) => {
      // Ensure checked is a boolean
      const isChecked = !!checked;
      
      setSelectAll(isChecked);
      setFormData((prev) => ({
        ...prev,
        recipients: isChecked ? contacts.map((contact) => contact._id) : [],
      }));
    },
    [contacts]
  )
  const handleRecipientChange = useCallback(
    (checked, contactId) => {
      setFormData((prev) => ({
        ...prev,
        recipients: checked ? [...prev.recipients, contactId] : prev.recipients.filter((id) => id !== contactId),
      }))
      setSelectAll(checked && formData.recipients.length + (checked ? 1 : -1) === contacts.length)
    },
    [contacts.length, formData.recipients.length],
  )
  const renderStepIndicator = () => {
    const steps = [
      { title: "Campaign Name", icon: Mail },
      { title: "Select Template", icon: CheckCircle2 },
      { title: "Add Recipients", icon: Users },
      { title: "Schedule", icon: Calendar },
    ]
    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step === i + 1
                  ? "border-primary bg-primary text-primary-foreground"
                  : step > i + 1
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-background text-muted-foreground"
              }`}
            >
              {s.icon && <s.icon className="w-5 h-5" />}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 transition-colors ${
                  step > i + 1 ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="campaignName" className="text-sm font-medium">
                Campaign Name
              </label>
              <Input
                id="campaignName"
                placeholder="Enter your campaign name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Choose a unique name to identify your campaign
              </p>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Mail className="w-12 h-12 text-muted-foreground" />
                <div className="text-center text-muted-foreground">
                  No templates available. Please create a template first.
                </div>
                <Button onClick={() => navigate("/templates/create")}>
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.templateId === template._id
                        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, templateId: template._id })}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {template.subject}
                    </div>
                    {template.variables?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 3:
          return (
            <div className="space-y-6">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Users className="w-12 h-12 text-muted-foreground" />
                  <div className="text-center text-muted-foreground">
                    No contacts available. Please add contacts first.
                  </div>
                  <Button onClick={() => navigate("/contacts/create")}>
                    Add Contacts
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {formData.recipients.length} recipients selected
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"  // Explicitly set type to prevent form submission
                      onClick={() => handleSelectAll(!selectAll)}
                    >
                      {selectAll ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="overflow-hidden border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={(checked) => {
                                handleSelectAll(checked);
                              }}
                              aria-label="Select all contacts"
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Organization</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact._id}>
                            <TableCell>
                              <Checkbox
                                checked={formData.recipients.includes(contact._id)}
                                onCheckedChange={(checked) =>
                                  handleRecipientChange(checked, contact._id)
                                }
                                aria-label={`Select ${contact.name}`}
                              />
                            </TableCell>
                            <TableCell>{contact.email}</TableCell>
                            <TableCell>{contact.name}</TableCell>
                            <TableCell>{contact.organization}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-7 gap-2">
              {getDatesForMonth().map((date) => (
                <Button
                  key={date.toISOString()}
                  variant={
                    formData.scheduledDate?.toDateString() === date.toDateString()
                      ? "default"
                      : "outline"
                  }
                  className={`flex flex-col items-center justify-center w-full p-2 h-16 text-xs ${
                    date < new Date() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, scheduledDate: date })}
                  disabled={loading || date < new Date()}
                >
                  <span className="text-lg font-semibold">{format(date, "d")}</span>
                  <span className="text-[10px]">{format(date, "MMM")}</span>
                </Button>
              ))}
            </div>
            {formData.scheduledDate && (
              <div className="flex items-center justify-center p-4 mt-4 space-x-2 text-sm border rounded-lg bg-muted/50">
                <Calendar className="w-4 h-4" />
                <span>Scheduled for: {format(formData.scheduledDate, "PPP")}</span>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }
  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }
  const handlePreviousStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      campaignSchema.parse(formData)
      setLoading(true)
      await toast.promise(
        campaignApi.create(formData),
        {
          loading: "Creating campaign...",
          success: () => {
            navigate("/campaigns-list")
            return "Campaign created successfully!"
          },
          error: (err) => {
            console.error("Campaign creation error:", err)
            return err.response?.data?.error || "Failed to create campaign"
          },
        },
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        console.error("Campaign creation error:", error)
        toast.error(error.response?.data?.error || "An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="container max-w-4xl py-8">
      <Card className="border-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Create Campaign</CardTitle>
          <CardDescription className="text-lg">
            {steps[step - 1].title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          <div className="min-h-[400px]">
            <form id="campaignForm" onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>
          </div>
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={loading || step === 1}
              className="w-32"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {step < 4 ? (
              <Button
                onClick={handleNextStep}
                disabled={loading}
                className="w-32"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || formData.recipients.length === 0}
                className="w-32"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default CampaignCreation