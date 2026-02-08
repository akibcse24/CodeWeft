/**
 * CodespaceCreator Component
 * 
 * Form to create a new GitHub Codespace
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '@/hooks/github/useGitOperations';
import { useRepoMachines, useCreateCodespace } from '@/hooks/github/useCodespacesOperations';
import { useQuery } from '@tanstack/react-query';
import { listBranches } from '@/services/github/git.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Monitor, GitBranch, Search, Loader2, Plus } from 'lucide-react';

export function CodespaceCreator() {
    const navigate = useNavigate();
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedMachine, setSelectedMachine] = useState<string>('');
    const [repoSearch, setRepoSearch] = useState('');

    // Get user repositories
    const { data: repos, isLoading: isLoadingRepos } = useRepositories();
    const createCodespace = useCreateCodespace();

    // Extract owner/repo from full name
    const [owner, repoName] = selectedRepo ? selectedRepo.split('/') : ['', ''];

    // Fetch branches for selected repo
    const { data: branches, isLoading: isLoadingBranches } = useQuery({
        queryKey: ['github', 'branches', owner, repoName],
        queryFn: () => listBranches(owner, repoName),
        enabled: !!selectedRepo,
    });

    // Fetch machines for selected repo/branch
    const { data: machines, isLoading: isLoadingMachines } = useRepoMachines(owner, repoName, selectedBranch);

    const filteredRepos = repos?.filter(r =>
        r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
    ) || [];

    const handleCreate = async () => {
        if (!selectedRepo || !selectedBranch || !selectedMachine) return;

        try {
            await createCodespace.mutateAsync({
                owner,
                repo: repoName,
                branch: selectedBranch,
                machine: selectedMachine
            });
            navigate('/github/codespaces');
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Button variant="ghost" className="mb-6" onClick={() => navigate('/github/codespaces')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Codespaces
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Create Codespace</CardTitle>
                    <CardDescription>
                        Configure your new cloud development environment.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Repository Selection */}
                    <div className="space-y-2">
                        <Label>Repository</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search repositories..."
                                className="pl-8 mb-2"
                                value={repoSearch}
                                onChange={(e) => setRepoSearch(e.target.value)}
                            />
                        </div>
                        {isLoadingRepos ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Loading repositories...
                            </div>
                        ) : (
                            <Select value={selectedRepo} onValueChange={(val) => {
                                setSelectedRepo(val);
                                setSelectedBranch('');
                                setSelectedMachine('');
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a repository" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {filteredRepos.slice(0, 50).map(repo => (
                                        <SelectItem key={repo.id} value={repo.full_name}>
                                            {repo.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Branch Selection */}
                    <div className="space-y-2">
                        <Label>Branch</Label>
                        <Select
                            value={selectedBranch}
                            onValueChange={(val) => {
                                setSelectedBranch(val);
                                setSelectedMachine('');
                            }}
                            disabled={!selectedRepo}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches?.map((branch: { name: string }) => (
                                    <SelectItem key={branch.name} value={branch.name}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isLoadingBranches && <p className="text-xs text-muted-foreground">Loading branches...</p>}
                    </div>

                    {/* Machine Type Selection */}
                    <div className="space-y-2">
                        <Label>Machine Type</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {isLoadingMachines ? (
                                <div className="p-4 border rounded-md flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading machine types...
                                </div>
                            ) : machines && machines.length > 0 ? (
                                machines.map(machine => (
                                    <div
                                        key={machine.name}
                                        className={`
                               flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors
                               ${selectedMachine === machine.name ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                            `}
                                        onClick={() => setSelectedMachine(machine.name)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Monitor className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-sm">{machine.display_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {machine.cpus} cores • {Math.round(machine.memory_in_bytes / (1024 * 1024 * 1024))}GB RAM • {Math.round(machine.storage_in_bytes / (1024 * 1024 * 1024))}GB Storage
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : selectedBranch ? (
                                <p className="text-sm text-muted-foreground">No machine types available or loading failed.</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Select a branch to view available machines.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-between">
                    <div className="text-xs text-muted-foreground">
                        Codespaces usage is billed to the repository owner.
                    </div>
                    <Button
                        onClick={handleCreate}
                        disabled={!selectedRepo || !selectedBranch || !selectedMachine || createCodespace.isPending}
                    >
                        {createCodespace.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" /> Create Codespace
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
