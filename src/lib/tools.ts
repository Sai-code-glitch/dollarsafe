/** Free public calculators. Each one is an SEO landing page that leads into the AI coach. */
export interface PublicTool {
  slug: string;
  title: string;
  /** Short card label on the tools index. */
  summary: string;
  /** Meta description for search results and link previews. */
  description: string;
  /** A question the visitor can ask the coach next. */
  followUp: string;
}

export const TOOLS: PublicTool[] = [
  {
    slug: "debt-payoff",
    title: "Debt Payoff Calculator",
    summary: "See when you'll be debt-free and compare avalanche vs snowball.",
    description:
      "Free debt payoff calculator. Enter your credit cards and loans to see your debt-free date, total interest, and payoff order with the avalanche or snowball method.",
    followUp: "Should I use extra money to pay debt or build savings first?",
  },
  {
    slug: "budget",
    title: "50/30/20 Budget Calculator",
    summary: "Split your take-home pay into needs, wants and savings.",
    description:
      "Free 50/30/20 budget calculator. Enter your monthly take-home pay to see how much to spend on needs, wants, and savings or debt, and adjust the split to fit you.",
    followUp: "My rent is more than half my pay. How should I adjust my budget?",
  },
  {
    slug: "emergency-fund",
    title: "Emergency Fund Calculator",
    summary: "Find your emergency fund target and how far you are from it.",
    description:
      "Free emergency fund calculator. Find out how many months of expenses to save based on your income stability and dependents, and see your gap to the goal.",
    followUp: "Where should I keep my emergency fund?",
  },
  {
    slug: "retirement",
    title: "Retirement Savings Calculator",
    summary: "Project your retirement savings in future and today's dollars.",
    description:
      "Free retirement calculator. Project your savings at retirement, adjust for inflation, and estimate the yearly income it could support.",
    followUp: "Am I saving enough for retirement at my age?",
  },
  {
    slug: "compound-interest",
    title: "Compound Interest Calculator",
    summary: "Watch monthly savings grow over time.",
    description:
      "Free compound interest calculator. See how a starting balance and monthly contributions could grow over time, and how much comes from growth versus deposits.",
    followUp: "How much should I be saving each month?",
  },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
