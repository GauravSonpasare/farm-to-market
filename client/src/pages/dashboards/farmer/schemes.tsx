import { FileBadge, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

const govtSchemes = [
  {
    id: 1,
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    description:
      "A central sector scheme providing income support to all landholding farmers' families in the country to supplement their financial needs for procuring various inputs related to agriculture and allied activities.",
    benefits: [
      "₹6,000 per year",
      "Payable in three equal installments",
      "Direct Benefit Transfer (DBT)",
    ],
    link: "https://pmkisan.gov.in/",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: 2,
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description:
      "Provides a comprehensive insurance cover against failure of the crop thus helping in stabilizing the income of the farmers.",
    benefits: [
      "Protection from natural calamities and pests",
      "Premium 2% for Kharif crops",
      "Premium 1.5% for Rabi crops",
    ],
    link: "https://pmfby.gov.in/",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: 3,
    title: "Soil Health Card Scheme",
    description:
      "A scheme to assist State Governments to issue Soil Health Cards to all farmers in the country to provide them information on the nutrient status of their soil along with recommendations on appropriate dosage of nutrients.",
    benefits: [
      "Soil nutrient analysis",
      "Fertilizer recommendations",
      "Improved crop yield guidance",
    ],
    link: "https://soilhealth.dac.gov.in/",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 4,
    title: "Kisan Credit Card (KCC)",
    description:
      "A scheme that provides adequate and timely credit support from the banking system via a single window with flexible and simplified procedure to the farmers for their cultivation and other needs.",
    benefits: [
      "Short term credit limits",
      "Post-harvest expenses cover",
      "Consumption requirements",
    ],
    link: "https://enam.gov.in/web/resources/kisan-credit-card",
    color: "from-teal-500 to-cyan-600",
  },
];

export default function FarmerSchemes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Government Schemes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Explore financial support and resources available to empower your farming
          business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {govtSchemes.map((scheme) => (
          <Card
            key={scheme.id}
            className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${scheme.color}`}></div>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${scheme.color} text-white shrink-0 shadow-sm`}>
                  <FileBadge size={24} />
                </div>
                <div>
                  <CardTitle className="text-lg leading-tight lg:text-xl text-slate-800">
                    {scheme.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 pt-1 text-sm text-slate-600 pb-2">
              <CardDescription className="text-sm">
                {scheme.description}
              </CardDescription>

              <div className="space-y-2 mt-4">
                <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Key Benefits
                </p>
                <ul className="space-y-1">
                  {scheme.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
              <a
                href={scheme.link}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                >
                  Visit Official Portal{" "}
                  <ArrowRight size={16} className="ml-2 opacity-50" />
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
