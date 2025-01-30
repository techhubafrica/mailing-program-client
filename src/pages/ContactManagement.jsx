import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { contactApi } from "@/services/api"
import { AddContactDialog } from "@/components/AddContactDialog"
import { UpdateContactDialog } from "@/components/UpdateContactDialog"
import { CSVUploadDialog } from "@/components/CSVUploadDialog"

export default function ContactManagement() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [searchDebounce, setSearchDebounce] = useState(null)

  const fetchContacts = async (pageNum = 1, searchTerm = "") => {
    try {
      setLoading(true)
      const response = await contactApi.getAll(pageNum, 10, searchTerm)
      setContacts(response.data.contacts)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Error fetching contacts", {
        description: error.message || "Failed to load contacts",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    toast.promise(
      async () => {
        await contactApi.delete(id)
        fetchContacts(page, search)
      },
      {
        loading: "Deleting contact...",
        success: "Contact successfully deleted",
        error: (err) => err.message || "Failed to delete contact",
      },
    )
  }

  const handleSearch = (e) => {
    const searchTerm = e.target.value
    setSearch(searchTerm)
    if (searchDebounce) clearTimeout(searchDebounce)
    setSearchDebounce(
      setTimeout(() => {
        setPage(1)
        fetchContacts(1, searchTerm)
      }, 300),
    )
  }

  useEffect(() => {
    fetchContacts(page, search)
  }, [page])

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
          <CardDescription>Manage your contacts and add new ones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 mb-4 space-x-4 md:flex-row">
            <AddContactDialog onContactAdded={() => fetchContacts(page, search)} />
            <CSVUploadDialog onContactsUploaded={() => fetchContacts(page, search)} />
          </div>
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
          <CardDescription>Manage your contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No contacts found. Add your first contact using the button above.
            </div>
          ) : (
            <>
              <AnimatePresence>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <motion.tr
                        key={contact._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.organization || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags?.length > 0 ? (
                              contact.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No tags</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <UpdateContactDialog
                              contact={contact}
                              onContactUpdated={() => fetchContacts(page, search)}
                            />
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(contact._id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </AnimatePresence>
              <div className="flex items-center justify-between mt-4">
                <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

