"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Edit, Filter } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";

export function FinancesTable({ cohortId }: { cohortId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFundId, setFilterFundId] = useState<string>("all");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "transactions"),
          where("cohortId", "==", cohortId)
        );
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const timeA = new Date(a.date || 0).getTime();
          const timeB = new Date(b.date || 0).getTime();
          return timeB - timeA;
        });

        setItems(list);
        
        const fundsSnap = await getDocs(query(collection(db, "funds"), where("cohortId", "==", cohortId)));
        const flist: any[] = [];
        fundsSnap.forEach(d => flist.push({ id: d.id, ...d.data() }));
        setFunds(flist);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    if (cohortId) {
      fetchItems();
    }
  }, [cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      setItems(items.filter(i => i.id !== id));
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Loading transactions...</div>;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-end">
        <div className="w-full sm:w-64 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(() => {
            const selectedFundName = filterFundId === 'all' ? 'All Funds' : filterFundId === 'general' ? 'General Fund' : funds.find(f => f.id === filterFundId)?.name || 'Filter by fund';
            return (
              <Select value={filterFundId} onValueChange={(val) => setFilterFundId(val || "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by fund">
                    {selectedFundName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Funds</SelectItem>
                  <SelectItem value="general">General Fund</SelectItem>
                  {funds.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>
      <div className="border rounded-md overflow-hidden bg-card overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Fund</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No transactions found.</TableCell>
            </TableRow>
          ) : (
            items
              .filter(item => filterFundId === 'all' || (filterFundId === 'general' ? !item.fundId : item.fundId === filterFundId))
              .map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={item.type === 'income' ? 'outline' : 'secondary'} className={item.type === 'income' ? 'text-emerald-500 border-emerald-500' : 'text-destructive'}>
                    {item.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{item.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 font-medium">
                    {item.fundName || "General Fund"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">Rs. {item.amount.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <Link href={`/admin?tab=finances&editId=${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    <Edit className="h-4 w-4" />
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this transaction.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
          {items.length > 0 && items.filter(item => filterFundId === 'all' || (filterFundId === 'general' ? !item.fundId : item.fundId === filterFundId)).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No transactions found for this fund.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
