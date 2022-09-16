const blogSchema = require("../Model/blogsModel");
const authorModel = require("../Model/authorModel");
let {
  isValidString,
  keyValid,
  idCharacterValid
} = require("../Validation/validator");
let mongoose = require("mongoose");
let jwt = require("jsonwebtoken");


//Creating Blogs=======================================>
const createBlogs = async function (req, res) {
  try {
    const data = req.body;

    if (!keyValid(data))
      return res
        .status(400)
        .send({ status: false, data: "The body Can't be Empty" });

    const { title, body, authorId, category } = data;

    if (!title)
      return res.status(400).send({ status: false, data: "title is required" });
    if (!body)
      return res.status(400).send({ status: false, data: "body is required" });
    if (!authorId)
      return res
        .status(400)
        .send({ status: false, data: "authorId is required" });
    if (!category)
      return res
        .status(400)
        .send({ status: false, data: "category is required" });

    if (!idCharacterValid(authorId))
      return res
        .status(400)
        .send({ status: false, data: "Please Enter valid author id" });

    let Author = await authorModel.findById(authorId);
    if (!Author)
      return res
        .status(400)
        .send({ status: false, message: "Author_Id not found In DB" });

    if (!isValidString(title))
      return res
        .status(400)
        .send({ status: false, data: "title is not valid String" });
    if (!isValidString(body))
      return res
        .status(400)
        .send({ status: false, data: "Body is not valid String" });
    if (!isValidString(category))
      return res
        .status(400)
        .send({ status: false, data: "Category is not valid String" });
    if (!isValidString(authorId))
      return res
        .status(400)
        .send({ status: false, data: "authorID is not valid String" });

    const createBlog = await blogSchema.create(data);
  return  res.status(201).send({ status: true, data: createBlog });
  } catch (err) {
    return res.status(500).send({ status: false, data: err.message });
  }
};



//Get Blogs==================================>
const getAllBlogs = async function (req, res) {
  try {
    const data = req.query;

    //Validating data is empty or not
    if (!keyValid(data)) {
      const blog = await blogSchema.find({
        isPublished: true,
        isDeleted: false,
      });
      if (blog.length == 0) {
        return res.status(404).send({
          status: false,
          msg: "Blog doesn't Exists,Alredy deleted",
        });
      }
     return res.status(200).send({ status: true, data: blog });
    }
    //get data by query param
    if (keyValid(data)) {
      data.isPublished = true;
      data.isDeleted = false;
      //console.log(data)
      let getBlog = await blogSchema.find(data).populate("authorId");
      if (getBlog.length == 0) {
        return res.status(404).send({
          status: false,
          msg: "No such blog exist, Please provide correct data.",
        });
      }
     return res.status(200).send({ status: true, data: getBlog });
    }
  } catch (error) {
   return res.status(500).send({ status: false, Error: error.message });
  }
};



//To update Blog=======================>
const updateBlog = async function (req, res) {
  try {

         const blogId = req.params.blogId;
      const blogData = req.body;
      let { title, body, tags, subcategory } = blogData;
   
      if (!idCharacterValid(blogId))
        return res.status(400).send({ status: false, msg: "blogId is invalid!" });

      if(!keyValid(blogData)) return res.status(400).send({ status: false, msg:"the Input is required" });
  


      if(title){ 
        if(!isValidString(title)) return res.status(404).send({ status: false, msg:"the Enter valid title" });
      }
      if(body){
        if(!isValidString(body)) return res.status(404).send({ status: false, msg:"the Enter valid Body" });
      }
      if(tags){
        if(!isValidString(tags)) return res.status(404).send({ status: false, msg:"the Enter valid tags" });
        if(!Array.isArray(tags)) return res.status(404).send({ status: false, msg:"the tags is not in array" });
      }
      if(subcategory){
        if(!isValidString(subcategory)) return res.status(404).send({ status: false, msg:"the Enter valid subcategory" });
        if(!Array.isArray(subcategory)) return res.status(404).send({ status: false, msg:"the subcategory is not in array" });
      }



      let blog = await blogSchema.findOneAndUpdate({ _id: blogId, isDeleted: false },
          {
              $set: { isPublished: true,title:title,body:body, publishedAt: new Date() },
              $push: { tags: tags, subcategory:subcategory }
          },
          { new: true });
      if(!blog) return res.status(200).send({ status: false,msg:"the blog is already deleted" });

          return res.status(200).send({ status: true, data: blog });
          
  } catch (error) { 
      return res.status(500).send({ status: false, Error: error.message })
  }

}


//To delete the Blog form path Params================================>
const deleteBlog = async function (req, res) {
  try {
    let blogId = req.params.blogId;

    let blogIdValid = await blogSchema.findById(blogId);

    if (!blogIdValid)
      return res
        .status(404)
        .send({ status: false, data: "the blog does not Exist" });

    let deletedoc = await blogSchema
      .findOne({ _id: blogId })
      .select({ isDeleted: 1, _id: 0 });
      
    if (deletedoc.isDeleted === true)
      return res
        .status(404)
        .send({ status: false, data: "the blog is alreday deleted" });

    let deleteBlog = await blogSchema.findOneAndUpdate(
      { _id: blogId },
      { $set: { isDeleted: true ,deletedAt:new Date()} },
      { new: true }
    );
   return res.status(200).send({status:true,msg:""});
  } catch (err) {
    return res.status(500).send({ status: false, data: err.message });
  }
};


//deleting the blogs by query params=======================================>

const deleteByKeys = async function (req, res) {
  try {
        let decodedId=req.decodedToken.userId
    
      const data = req.query

      if (!keyValid(data)) return res.status(400).send({ status: false, msg: "Please give input" })

      let {authorId,category,subcategory,tags}=data
      let filter={}

      if(authorId){
        if(!idCharacterValid(authorId)) return res.status(400).send({ status: false, msg: 'please Give the valid AuthorID' })
        if(decodedId!=authorId) return res.status(404).send({ status: false, msg:"you are not the Authorized person to delete" }) 
        filter.authorId=authorId
      }

     if (category) {
          if (!isValidString(category)) return res.status(400).send({ status: false, msg: 'please provide category' })
          filter.category=category
      }
      if (subcategory) {
          if (!isValidString(subcategory)) return res.status(400).send({ status: false, msg: 'please provide subcategory' })
          filter.subcategory=subcategory
      }
      if (tags) {
          if (!isValidString(tags)) return res.status(400).send({ status: false, msg: 'please provide tags' })
          filter.tags=tags
      }
      let getTheblog=await blogSchema.find(filter).select({authorId:1})
      if(getTheblog.length===0) return res.status(404).send({ status: false, msg: 'The blogs are not found' })
      for(let i=0;i<getTheblog.length;i++){
        if(getTheblog[i].authorId.toString()===decodedId){
        filter.authorId=getTheblog[i].authorId,
        filter.isDeleted=false,
        filter.isPublished=false
        let deleteByQuery=await blogSchema.updateMany(filter,
        {
          $set:{isDeleted:true,deletedAt:new Date()}
        })
          
        if(deleteByQuery.modifiedCount===0) {
          return res.status(404).send({status:false,message:"The blogs are already deleted"})
      }
      return res.status(200).send({status:true,message:"deleted successfully"}) 
      }else{
        return res.status(403).send({status:false,message:"You are not authorized to deleted"})
      }
    }

  }
  catch (error) {   
      res.status(500).send({ status: false, msg: error.message });
  }
};

module.exports = {
  createBlogs,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  deleteByKeys
};




