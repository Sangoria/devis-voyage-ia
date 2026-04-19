import LegalPage from "../../components/LegalPage";
import content from "../../content/legal/cgu.md?raw";

export default function CGU() {
  return <LegalPage title="Conditions générales d'utilisation" lastUpdated="17 avril 2025" content={content} />;
}
