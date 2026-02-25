import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import WorkmateIdentification from "./components/WorkmateIdentification";
import AdminLogin from "./components/AdminLogin";
import AdminSignup from "./components/AdminSignup";
import WorkmateLanding from "./components/WorkmateLanding";
import CompanyRules from "./components/onboarding/CompanyRules";
import TrainingVideo from "./components/onboarding/TrainingVideo";
import KnowledgeCheck from "./components/onboarding/KnowledgeCheck";
import DisciplinaryProcess from "./components/onboarding/DisciplinaryProcess";
import AdminDashboard from "./components/admin/AdminDashboard";
import VideoManagement from "./components/admin/VideoManagement";
import QuestionManagement from "./components/admin/QuestionManagement";
import Settings from "./components/admin/Settings";
import ExportData from "./components/admin/ExportData";
import OnboardingRecords from "./components/admin/OnboardingRecords";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: WorkmateIdentification },
      { path: "admin-login", Component: AdminLogin },
      { path: "admin-signup", Component: AdminSignup },
      { path: "workmate/:id", Component: WorkmateLanding },
      { path: "onboarding/:id/rules", Component: CompanyRules },
      { path: "onboarding/:id/video", Component: TrainingVideo },
      { path: "onboarding/:id/quiz", Component: KnowledgeCheck },
      { path: "onboarding/:id/discipline", Component: DisciplinaryProcess },
      { path: "admin/dashboard", Component: AdminDashboard },
      { path: "admin/records", Component: OnboardingRecords },
      { path: "admin/videos", Component: VideoManagement },
      { path: "admin/questions", Component: QuestionManagement },
      { path: "admin/export", Component: ExportData },
      { path: "admin/settings", Component: Settings },
    ],
  },
]);