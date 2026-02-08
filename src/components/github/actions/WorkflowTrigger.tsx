import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Play, Loader2 } from 'lucide-react';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useGitOperations } from '@/hooks/useGitOperations';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTriggerProps {
    owner: string;
    repo: string;
    workflowId: number;
    workflowName: string;
}

export function WorkflowTrigger({
    owner,
    repo,
    workflowId,
    workflowName,
}: WorkflowTriggerProps) {
    const [open, setOpen] = useState(false);
    const [ref, setRef] = useState('main'); // Default branch
    const [inputs, setInputs] = useState(''); // JSON string for inputs
    const { toast } = useToast();

    const { triggerWorkflow, isTriggeringWorkflow } = useWorkflows({ owner, repo });
    const { branches } = useGitOperations({ owner, repo });

    const handleTrigger = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsedInputs: Record<string, any> | undefined;

        if (inputs.trim()) {
            try {
                parsedInputs = JSON.parse(inputs);
            } catch (e) {
                toast({
                    title: 'Invalid JSON',
                    description: 'Please enter valid JSON for inputs',
                    variant: 'destructive',
                });
                return;
            }
        }

        triggerWorkflow(
            {
                workflowId,
                ref,
                inputs: parsedInputs,
            },
            {
                onSuccess: () => {
                    setOpen(false);
                    setInputs('');
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Play className="h-3 w-3 mr-2" />
                    Run Workflow
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Run Workflow: {workflowName}</DialogTitle>
                    <DialogDescription>
                        Manually trigger this workflow. Specify the branch and any required inputs.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branch" className="text-right">
                            Branch
                        </Label>
                        <div className="col-span-3">
                            <Select value={ref} onValueChange={setRef}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="main">main</SelectItem>
                                    {branches?.map((branch) => (
                                        <SelectItem key={branch.name} value={branch.name}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="inputs" className="text-right mt-2">
                            Inputs (JSON)
                        </Label>
                        <Textarea
                            id="inputs"
                            placeholder='{"environment": "production"}'
                            className="col-span-3 font-mono text-xs"
                            value={inputs}
                            onChange={(e) => setInputs(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleTrigger} disabled={isTriggeringWorkflow}>
                        {isTriggeringWorkflow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Workflow
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
