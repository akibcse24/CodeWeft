import {
    Home,
    CheckSquare,
    FileText,
    GraduationCap,
    Code2,
    BarChart2,
    Keyboard,
    BookOpen,
    Brain,
    TrendingUp,
    Timer,
    Moon,
    Sparkles,
    FolderKanban,
    Hammer,
    FlaskConical,
    Database,
    GitBranch,
    Github,
    Play,
    Monitor,
    Archive,
    Bot,
    Terminal,
    Brush,
    Briefcase,
    Globe,
    Palette,
    Wrench,
    Book,
    Box,
    FolderKanban as GraphIcon,
    BarChart3,
    Shield,
    Settings,
    Trash2
} from "lucide-react";

export const mainNavItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

export const studyItems = [
    { title: "Notes", url: "/notes", icon: FileText },
    { title: "Courses", url: "/courses", icon: GraduationCap },
    { title: "DSA Problems", url: "/dsa", icon: Code2 },
    { title: "Algo Visualizer", url: "/algo-visualizer", icon: BarChart2 },
    { title: "Code Type", url: "/code-type", icon: Keyboard },
    { title: "Resources", url: "/resources", icon: BookOpen },
    { title: "Flashcards", url: "/flashcards", icon: Brain },
    { title: "Growth Hub", url: "/growth-hub", icon: TrendingUp },
];

export const productivityItems = [
    { title: "Pomodoro", url: "/pomodoro", icon: Timer },
    { title: "Zen Room", url: "/zen-room", icon: Moon },
    { title: "Habits", url: "/habits", icon: Sparkles },
    { title: "Projects", url: "/projects", icon: FolderKanban },
    { title: "Builder Hub", url: "/builder-hub", icon: Hammer },
];

export const mlItems = [
    { title: "ML Notes", url: "/ml-notes", icon: FlaskConical },
    { title: "Papers", url: "/papers", icon: FileText },
    { title: "Datasets", url: "/datasets", icon: Database },
];

export const githubNavItems = [
    { title: "Git Operations", url: "/github/operations", icon: GitBranch },
    { title: "Repositories", url: "/github/repositories", icon: Github },
    { title: "Code Editor", url: "/github/editor", icon: Code2 },
    { title: "Branches", url: "/github/branches", icon: GitBranch },
    { title: "Gists", url: "/github/gists", icon: Code2 },
    { title: "Actions", url: "/github/actions", icon: Play },
    { title: "Codespaces", url: "/github/codespaces", icon: Monitor },
    { title: "Backups", url: "/github/backup", icon: Archive },
];

export const toolsNavItems = [
    { title: "AI Assistant", url: "/ai", icon: Bot },
    { title: "DevBox", url: "/devbox", icon: Terminal },
    { title: "Whiteboard", url: "/whiteboard", icon: Brush },
    { title: "Interview Hub", url: "/interview-hub", icon: Briefcase },
    { title: "API Client", url: "/api-client", icon: Globe },
    { title: "Regex Lab", url: "/regex-lab", icon: FlaskConical },
    { title: "Theme Forge", url: "/theme-forge", icon: Palette },
    { title: "Dev Utils", url: "/dev-utils", icon: Wrench },
    { title: "Cheat Sheets", url: "/cheat-sheets", icon: Book },
    { title: "Asset Studio", url: "/asset-studio", icon: Box },
    { title: "Graph View", url: "/graph", icon: GraphIcon },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
    { title: "Secrets Vault", url: "/secrets", icon: Shield },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Trash", url: "/trash", icon: Trash2 },
];
