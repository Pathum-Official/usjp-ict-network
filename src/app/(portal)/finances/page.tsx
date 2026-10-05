"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, TrendingUp, TrendingDown, Wallet, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinancesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFundId, setFilterFundId] = useState<string>("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.cohortId) return;
      try {
        const q = query(
          collection(db, "transactions"),
          where("cohortId", "==", user.cohortId)
        );
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const timeA = new Date(a.date || 0).getTime();
          const timeB = new Date(b.date || 0).getTime();
          return timeB - timeA;
        });

        setTransactions(list);
        const fundsSnap = await getDocs(query(collection(db, "funds"), where("cohortId", "==", user.cohortId)));
        const flist: any[] = [];
        fundsSnap.forEach(d => flist.push({ id: d.id, ...d.data() }));
        setFunds(flist);

      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user?.cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const fundsToDisplay = [
    { id: 'general', name: 'General Fund', description: 'Main cohort fund' },
    ...funds
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-xl">
            <Receipt className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Batch Finances</h1>
            <p className="text-muted-foreground">Transparent fund tracking for {user?.cohortId?.toUpperCase() || 'your cohort'}.</p>
          </div>
        </div>
        
        {user && ['rep', 'treasurer', 'super_admin'].includes(user.role) && (
          <Link href="/admin?tab=finances" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Manage Finances
          </Link>
        )}
      </div>

      <div className="mb-2">
        <h2 className="text-xl font-semibold">Total Portfolio Balance</h2>
        <div className="text-4xl font-bold mt-1">Rs. {balance.toLocaleString()}</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {fundsToDisplay.map(f => {
          const fundTxs = transactions.filter(t => (t.fundId === f.id) || (!t.fundId && f.id === 'general'));
          const fInc = fundTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0);
          const fExp = fundTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0);
          const fBal = fInc - fExp;
          
          return (
            <Card key={f.id} className="relative overflow-hidden border-primary/20">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  {f.name}
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>{f.description || 'Cohort Fund'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">Rs. {fBal.toLocaleString()}</div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center text-emerald-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Rs. {fInc.toLocaleString()}
                  </div>
                  <div className="flex items-center text-destructive">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Rs. {fExp.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>A detailed list of all approved income and expenses.</CardDescription>
          </div>
          <div className="w-full sm:w-48">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 ml-4" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No transactions found for this cohort.</p>
              </div>
            ) : (
              transactions
                .filter(tx => filterFundId === 'all' || (filterFundId === 'general' ? !tx.fundId : tx.fundId === filterFundId))
                .map((tx, i) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'}`}>
                      {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">{tx.title || tx.description}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <Badge variant="outline" className="font-normal bg-secondary/10 text-secondary border-secondary/20">
                          {tx.fundName || 'General Fund'}
                        </Badge>
                        <span className="text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
                    </span>
                    {tx.receiptUrl && <Badge variant="outline" className="hidden sm:inline-flex cursor-pointer hover:bg-muted">Receipt</Badge>}
                    {user && ['rep', 'treasurer', 'super_admin'].includes(user.role) && (
                      <div className="flex gap-1 ml-2 border-l pl-2">
                        <Link href={`/admin?tab=finances&editId=${tx.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-7 w-7" })}>
                          <Edit className="h-3 w-3" />
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" />}>
                            <Trash2 className="h-3 w-3" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction record.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            {transactions.length > 0 && transactions.filter(tx => filterFundId === 'all' || (filterFundId === 'general' ? !tx.fundId : tx.fundId === filterFundId)).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for this fund.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
