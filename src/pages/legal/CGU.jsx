import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/cgu.md?raw";

export default function CGU() {
  return <LegalPage title="Conditions générales d'utilisation" lastUpdated="avril 2026" content={content} />;
}
