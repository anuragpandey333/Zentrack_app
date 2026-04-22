export const createUser = async (req, res) => {
        try{
            const data=req.body;
            console.log(data);
            res.status(201).json({message:"User created successfully"})

        }catch(err){ 
            res.status(500).json({message:err.message})
         
        }
}
export const login = async (req, res) => {
        try{
            const data=req.body;
            console.log(data);
            res.status(201).json({message:"User login successfully"})

        }catch(err){ 
            res.status(500).json({message:err.message})
         
        }
}