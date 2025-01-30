import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contactApi, emailApi, templateApi } from "@/services/api";

// Zod schema for form validation
const mailSchema = z.object({
  templateId: z.string().min(1, "Please select a template"),
  contacts: z.array(z.string()).min(1, "At least one contact is required"),
  customVariables: z.record(z.string(), z.string()).optional(),
});

// Reusable Template Selector Component
const TemplateSelector = ({ control, templates, errors }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">Email Template</label>
    <Controller
      name="templateId"
      control={control}
      render={({ field }) => (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder="Select email template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem
                key={template._id}
                value={template._id}
                className="flex flex-col items-start"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground">
                  {template.subject}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
    {errors.templateId && (
      <p className="text-sm text-red-500">{errors.templateId.message}</p>
    )}
  </div>
);

// Reusable Custom Variables Component
const CustomVariables = ({
  customVars,
  handleAddVariable,
  handleRemoveVariable,
  handleVariableChange,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">Custom Variables</label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddVariable}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variable
      </Button>
    </div>

    <div className="space-y-2">
      {customVars.map((variable, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Variable name"
            value={variable.key}
            onChange={(e) => handleVariableChange(index, "key", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Variable value"
            value={variable.value}
            onChange={(e) =>
              handleVariableChange(index, "value", e.target.value)
            }
            className="flex-1 capitalize"
          />
          {index > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveVariable(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Main SendMail Component
export default function SendMail() {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [customVars, setCustomVars] = useState([{ key: "", value: "" }]);
  const [activeTab, setActiveTab] = useState("bulk");
  const [selectAll, setSelectAll] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mailSchema),
    defaultValues: {
      templateId: "",
      contacts: [],
      customVariables: {},
    },
  });

  const watchContacts = watch("contacts");

  // Load templates and contacts on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await templateApi.getAll();
        setTemplates(response.data.templates || response.data);
      } catch (error) {
        toast.error("Failed to load templates", {
          description: error.message,
        });
      } finally {
        setTemplatesLoading(false);
      }
    };

    const loadContacts = async () => {
      try {
        const response = await contactApi.getAll();
        setContacts(response.data.contacts || response.data);
      } catch (error) {
        toast.error("Failed to load contacts", {
          description: error.message,
        });
      } finally {
        setContactsLoading(false);
      }
    };

    loadTemplates();
    loadContacts();
  }, []);

  // Add a new custom variable
  const handleAddVariable = () => {
    setCustomVars([...customVars, { key: "", value: "" }]);
  };

  // Remove a custom variable
  const handleRemoveVariable = (index) => {
    const newVars = customVars.filter((_, i) => i !== index);
    setCustomVars(newVars);

    const updatedVars = {};
    newVars.forEach(({ key, value }) => {
      if (key && value) updatedVars[key] = value;
    });
    setValue("customVariables", updatedVars);
  };

  // Update a custom variable
  const handleVariableChange = (index, field, value) => {
    const newVars = [...customVars];
    newVars[index][field] = value;
    setCustomVars(newVars);

    const updatedVars = {};
    newVars.forEach(({ key, value }) => {
      if (key && value) updatedVars[key] = value;
    });
    setValue("customVariables", updatedVars);
  };

  // Select or deselect all contacts
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setValue(
      "contacts",
      checked ? contacts.map((contact) => contact.email) : []
    );
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setSending(true);
      setProgress(0);

      const validVars = {};
      customVars.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          validVars[key.trim()] = value.trim();
        }
      });
      data.customVariables = validVars;

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 90));
      }, 300);

      let response;
      if (activeTab === "single") {
        if (!manualEmail) {
          throw new Error("Contact email is required for single email sending");
        }
        const singleEmailData = {
          templateId: data.templateId,
          email: manualEmail,
          customVariables: data.customVariables,
        };
        response = await emailApi.sendSingle(singleEmailData);
      } else {
        response = await emailApi.sendBulk(data);
      }

      clearInterval(progressInterval);
      setProgress(100);

      toast.success("Email(s) sent", {
        description:
          activeTab === "single"
            ? "Email sent successfully"
            : `Successfully sent to ${
                response.data.results.successful.length
              } contact(s)${
                response.data.results.failed?.length
                  ? `. Failed: ${response.data.results.failed.length}`
                  : ""
              }`,
      });

      setValue("contacts", []);
      setManualEmail("");
      setCustomVars([{ key: "", value: "" }]);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("Error sending email(s)", {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Send Email</CardTitle>
            <CardDescription>
              Send bulk or single emails using templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bulk">Bulk Email</TabsTrigger>
                <TabsTrigger value="single">Single Email</TabsTrigger>
              </TabsList>
              <TabsContent value="bulk">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <TemplateSelector
                    control={control}
                    templates={templates}
                    errors={errors}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAll"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label
                        htmlFor="selectAll"
                        className="text-sm font-medium"
                      >
                        Select All Contacts
                      </label>
                    </div>
                    <div className="p-2 overflow-y-auto border rounded-md max-h-60">
                      {contactsLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                          <div className="w-6 h-6 border-2 rounded-full border-primary border-t-transparent animate-spin" />
                          <p className="text-sm text-muted-foreground">
                            Loading contacts...
                          </p>
                        </div>
                      ) : contacts.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-sm text-muted-foreground">
                            No contacts found
                          </p>
                        </div>
                      ) : (
                        contacts.map((contact) => (
                          <div
                            key={contact._id}
                            className="flex items-center py-1 space-x-2"
                          >
                            <Controller
                              name="contacts"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  id={contact._id}
                                  checked={field.value.includes(contact.email)}
                                  onCheckedChange={(checked) => {
                                    const updatedContacts = checked
                                      ? [...field.value, contact.email]
                                      : field.value.filter(
                                          (email) => email !== contact.email
                                        );
                                    field.onChange(updatedContacts);
                                    setSelectAll(
                                      updatedContacts.length === contacts.length
                                    );
                                  }}
                                />
                              )}
                            />
                            <label htmlFor={contact._id} className="text-sm">
                              {contact.email} - {contact.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {errors.contacts && (
                      <p className="text-sm text-red-500">
                        {errors.contacts.message}
                      </p>
                    )}
                  </div>

                  <CustomVariables
                    customVars={customVars}
                    handleAddVariable={handleAddVariable}
                    handleRemoveVariable={handleRemoveVariable}
                    handleVariableChange={handleVariableChange}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sending || templatesLoading || contactsLoading}
                  >
                    {sending ? "Sending..." : "Send Bulk Email"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="single">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <TemplateSelector
                    control={control}
                    templates={templates}
                    errors={errors}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                      type="email"
                      placeholder="Enter contact email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                    />
                  </div>

                  <CustomVariables
                    customVars={customVars}
                    handleAddVariable={handleAddVariable}
                    handleRemoveVariable={handleRemoveVariable}
                    handleVariableChange={handleVariableChange}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sending || templatesLoading || !manualEmail}
                  >
                    {sending ? "Sending..." : "Send Single Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <AnimatePresence>
              {progress > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full space-y-2"
                >
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {progress === 100 ? "Complete!" : "Sending email(s)..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
