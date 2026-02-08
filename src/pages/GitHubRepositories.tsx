import { RepositoryList } from '@/components/github/git-ops/RepositoryList';

export default function GitHubRepositories() {
    return (
        <div className="container mx-auto py-6 max-w-[var(--page-width)]">
            <RepositoryList />
        </div>
    );
}
