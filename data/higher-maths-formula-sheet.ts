export const higherMathsFormulaSheet = {
  title: "Higher Maths formula sheet",
  source: "Official Higher Mathematics exam formulae list supplied to Sprint D",
  sections: [
    {
      id: "circle",
      title: "Circle",
      formulae: [
        "$x^2+y^2+2gx+2fy+c=0$ represents a circle centre $(-g,-f)$ and radius $\\sqrt{g^2+f^2-c}$.",
        "$(x-a)^2+(y-b)^2=r^2$ represents a circle centre $(a,b)$ and radius $r$.",
      ],
    },
    {
      id: "scalar-product",
      title: "Scalar Product",
      formulae: [
        "$\\mathbf{a}\\boldsymbol{\\cdot}\\mathbf{b}=|\\mathbf{a}||\\mathbf{b}|\\cos\\theta$, where $\\theta$ is the angle between $\\mathbf{a}$ and $\\mathbf{b}$.",
        "$\\mathbf{a}\\boldsymbol{\\cdot}\\mathbf{b}=a_1b_1+a_2b_2+a_3b_3$, where $\\mathbf{a}=\\begin{pmatrix}a_1\\\\a_2\\\\a_3\\end{pmatrix}$ and $\\mathbf{b}=\\begin{pmatrix}b_1\\\\b_2\\\\b_3\\end{pmatrix}$.",
      ],
    },
    {
      id: "trigonometric-formulae",
      title: "Trigonometric formulae",
      formulae: [
        "$\\sin(A\\pm B)=\\sin A\\cos B\\pm\\cos A\\sin B$",
        "$\\cos(A\\pm B)=\\cos A\\cos B\\mp\\sin A\\sin B$",
        "$\\sin 2A=2\\sin A\\cos A$",
        "$\\cos 2A=\\cos^2 A-\\sin^2 A=2\\cos^2 A-1=1-2\\sin^2 A$",
      ],
    },
    {
      id: "standard-derivatives",
      title: "Table of standard derivatives",
      table: {
        headings: ["$f(x)$", "$f'(x)$"],
        rows: [
          ["$\\sin ax$", "$a\\cos ax$"],
          ["$\\cos ax$", "$-a\\sin ax$"],
        ],
      },
    },
    {
      id: "standard-integrals",
      title: "Table of standard integrals",
      table: {
        headings: ["$f(x)$", "$\\int f(x)\\,dx$"],
        rows: [
          ["$\\sin ax$", "$-\\frac{1}{a}\\cos ax+c$"],
          ["$\\cos ax$", "$\\frac{1}{a}\\sin ax+c$"],
        ],
      },
    },
  ],
} as const;

